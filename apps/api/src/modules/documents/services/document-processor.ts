import {
	DocumentErrorMessage,
	DocumentProcessingPhase,
	DocumentSourceType,
	DocumentStatus,
} from "@knowledgeprism/constants";
import {
	type DocumentChunk,
	downloadDocument,
	extract,
	type ExtractionResponseRecord,
	type ExtractionResult,
	type KnowledgeItem,
	parseDocument,
	type ParsedPageBlock,
	toDocumentChunks,
	translate,
	withTranslatedSectionTitles,
} from "@knowledgeprism/worker";

import { type Database } from "~/infrastructure/database/database.js";
import { type Logger } from "~/infrastructure/logger/logger.js";
import { ExtractionRunStatus } from "~/modules/documents/libs/constants/extraction-run-status.constant.js";
import { DocumentProcessingError } from "~/modules/documents/libs/exceptions/document-processing.exception.js";
import { createOrderedProgressReporter } from "~/modules/documents/libs/helpers/create-ordered-progress-reporter.helper.js";
import { toExtractionMetrics } from "~/modules/documents/libs/helpers/to-extraction-metrics.helper.js";
import { type ProcessingAttempt } from "~/modules/documents/libs/types/processing-attempt.type.js";
import { type DocumentEntity } from "~/modules/documents/models/document.entity.js";
import { type DocumentRepository } from "~/modules/documents/repositories/document.repository.js";
import {
	type ExtractionItemRepository,
	type NewExtractionItem,
} from "~/modules/documents/repositories/extraction-item.repository.js";
import { type ExtractionRunRepository } from "~/modules/documents/repositories/extraction-run.repository.js";
import { type GlossaryService } from "~/modules/glossary/services/glossary.service.js";

const EMPTY_EXTRACTION_ITEM_COUNT = 0;
const MANUAL_TEXT_PAGE_NUMBER = 1;
const PAGE_TEXT_SEPARATOR = "\n\n";

type Constructor = {
	database: Database;
	documentRepository: DocumentRepository;
	extractionChunkLength: number;
	extractionItemRepository: ExtractionItemRepository;
	extractionRunRepository: ExtractionRunRepository;
	glossaryService: GlossaryService;
	logger: Logger;
};

type RunExtraction = {
	extraction: ExtractionResult;
	translatedChunks: DocumentChunk[];
};

const toNewExtractionItem = (
	{
		blocks,
		confidence,
		heading,
		position,
		rationale,
		sourceExcerpt,
		sourcePageNumber,
		text,
		title,
	}: KnowledgeItem,
	extractionRunId: number,
): NewExtractionItem => ({
	blocks,
	confidence,
	extractionRunId,
	heading,
	position,
	rationale,
	sourceExcerpt,
	sourcePageNumber,
	text,
	title,
});

class DocumentProcessor {
	private database: Database;

	private documentRepository: DocumentRepository;

	private extractionChunkLength: number;

	private extractionItemRepository: ExtractionItemRepository;

	private extractionRunRepository: ExtractionRunRepository;

	private glossaryService: GlossaryService;

	private logger: Logger;

	public constructor({
		database,
		documentRepository,
		extractionChunkLength,
		extractionItemRepository,
		extractionRunRepository,
		glossaryService,
		logger,
	}: Constructor) {
		this.database = database;
		this.documentRepository = documentRepository;
		this.extractionChunkLength = extractionChunkLength;
		this.extractionItemRepository = extractionItemRepository;
		this.extractionRunRepository = extractionRunRepository;
		this.glossaryService = glossaryService;
		this.logger = logger;
	}

	private async completeRun({
		attempt,
		document,
		documentId,
		extractionRunId,
		pages,
	}: ProcessingAttempt & {
		document: DocumentEntity;
		extractionRunId: number;
		pages: ParsedPageBlock[];
	}): Promise<boolean> {
		const { extraction, translatedChunks } = await this.runExtraction({
			attempt,
			documentId,
			extractionRunId,
			pages,
		});
		const { failedPageNumbers, items } = extraction;

		if (items.length === EMPTY_EXTRACTION_ITEM_COUNT) {
			throw new DocumentProcessingError(
				DocumentErrorMessage.NO_KNOWLEDGE_EXTRACTED,
			);
		}

		const isCompleted = await this.database.transaction(async (transaction) => {
			const completedDocument =
				await this.documentRepository.compareAndSwapStatus(
					{
						errorMessage: null,
						expectedStatus: DocumentStatus.PROCESSING,
						failedPageNumbers,
						id: documentId,
						processingAttempt: attempt,
						status: DocumentStatus.INTEGRATING,
					},
					transaction,
				);

			if (!completedDocument) {
				return false;
			}

			await this.extractionItemRepository.replacePending(
				{
					documentId,
					items: items.map((item) =>
						toNewExtractionItem(item, extractionRunId),
					),
				},
				transaction,
			);

			await this.extractionItemRepository.markPendingApproved(
				documentId,
				transaction,
			);

			return true;
		});

		if (isCompleted) {
			void this.glossaryService.addTermsFromDocument({
				content: translatedChunks
					.map(({ content }) => content)
					.join(PAGE_TEXT_SEPARATOR),
				documentId,
				projectId: document.toObject().projectId,
			});
		}

		return isCompleted;
	}

	private async loadPages(
		document: DocumentEntity,
	): Promise<ParsedPageBlock[]> {
		const { content, mimeType, s3Key, sourceType } = document.toObject();

		if (sourceType === DocumentSourceType.MANUAL) {
			return [{ content: content ?? "", pageNumber: MANUAL_TEXT_PAGE_NUMBER }];
		}

		if (!s3Key) {
			throw new Error("Uploaded document has no S3 key.");
		}

		const bytes = await downloadDocument(s3Key);

		return await parseDocument({ bytes, contentType: mimeType });
	}

	private async runExtraction({
		attempt,
		documentId,
		extractionRunId,
		pages,
	}: ProcessingAttempt & {
		extractionRunId: number;
		pages: ParsedPageBlock[];
	}): Promise<RunExtraction> {
		const chunks = toDocumentChunks(pages, this.extractionChunkLength);
		const chunkIds = await this.extractionRunRepository.createChunks({
			chunks: chunks.map((chunk) => ({
				content: chunk.content,
				pageEnd: chunk.pageEnd,
				pageStart: chunk.pageNumber,
				position: chunk.position,
				sectionTitle: chunk.sectionTitle,
			})),
			extractionRunId,
		});
		const translatedChunks = withTranslatedSectionTitles(
			chunks,
			await translate(chunks),
		);
		await this.extractionRunRepository.updateTranslations(
			translatedChunks.flatMap(({ content, position }) => {
				const id = chunkIds.get(position);
				const isTranslated = chunks[position]?.content !== content;

				return id !== undefined && isTranslated
					? [{ id, translatedContent: content }]
					: [];
			}),
		);
		const responses: ExtractionResponseRecord[] = [];
		const saveResponse = async (
			response: ExtractionResponseRecord,
		): Promise<void> => {
			responses.push(response);
			const documentChunkId = chunkIds.get(response.chunkIndex);

			if (documentChunkId === undefined) {
				return;
			}

			await this.extractionRunRepository.createResponse({
				attempt: response.attempt,
				documentChunkId,
				errorReason: response.errorReason,
				rawResponse: response.rawResponse,
				splitPart: response.splitPart,
			});
		};
		const extraction = await extract(translatedChunks, {
			context: { documentId, processingAttempt: attempt },
			maximumChunkLength: this.extractionChunkLength,
			onProgress: createOrderedProgressReporter((progress) =>
				this.documentRepository.updateProcessingProgress({
					id: documentId,
					processingAttempt: attempt,
					progress,
					status: DocumentStatus.PROCESSING,
				}),
			),
			onResponse: saveResponse,
		});

		this.logger.info("Document extraction metrics.", {
			documentId,
			processingAttempt: attempt,
			...toExtractionMetrics({
				chunkCount: chunks.length,
				failedPageNumbers: extraction.failedPageNumbers,
				items: extraction.items,
				pageCount: pages.length,
				responses,
			}),
		});

		return { extraction, translatedChunks };
	}

	public async process({
		attempt,
		documentId,
	}: ProcessingAttempt): Promise<boolean> {
		const document = await this.documentRepository.findById(documentId);

		if (!document) {
			throw new Error(DocumentErrorMessage.NOT_FOUND);
		}

		const isCurrent = await this.documentRepository.updateProcessingProgress({
			id: documentId,
			processingAttempt: attempt,
			progress: {
				failedUnits: 0,
				phase: DocumentProcessingPhase.READING,
				processedUnits: 0,
				totalUnits: null,
			},
			status: DocumentStatus.PROCESSING,
		});
		if (!isCurrent) {
			return false;
		}
		const pages = await this.loadPages(document);
		const extractionRunId = await this.extractionRunRepository.create({
			documentId,
			processingAttempt: attempt,
		});

		try {
			const isCompleted = await this.completeRun({
				attempt,
				document,
				documentId,
				extractionRunId,
				pages,
			});
			await this.extractionRunRepository.finish({
				id: extractionRunId,
				status: isCompleted
					? ExtractionRunStatus.COMPLETED
					: ExtractionRunStatus.CANCELLED,
			});

			return isCompleted;
		} catch (error) {
			await this.extractionRunRepository.finish({
				id: extractionRunId,
				status: ExtractionRunStatus.FAILED,
			});

			throw error;
		}
	}
}

export { DocumentProcessor };
