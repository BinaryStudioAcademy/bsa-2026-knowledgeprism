import {
	DocumentErrorMessage,
	DocumentProcessingPhase,
	DocumentSourceType,
	DocumentStatus,
} from "@knowledgeprism/constants";
import {
	downloadDocument,
	extract,
	type ExtractionBlock,
	parseDocument,
} from "@knowledgeprism/worker";

import { type Database } from "~/infrastructure/database/database.js";
import { type ProcessingAttempt } from "~/modules/documents/libs/types/processing-attempt.type.js";
import { type DocumentEntity } from "~/modules/documents/models/document.entity.js";
import { type DocumentRepository } from "~/modules/documents/repositories/document.repository.js";
import { type ExtractionItemRepository } from "~/modules/documents/repositories/extraction-item.repository.js";
import { type GlossaryService } from "~/modules/glossary/services/glossary.service.js";

const MANUAL_TEXT_PAGE_NUMBER = 1;
const PAGE_TEXT_SEPARATOR = "\n\n";

type Constructor = {
	database: Database;
	documentRepository: DocumentRepository;
	extractionItemRepository: ExtractionItemRepository;
	glossaryService: GlossaryService;
};

class DocumentProcessor {
	private database: Database;

	private documentRepository: DocumentRepository;

	private extractionItemRepository: ExtractionItemRepository;

	private glossaryService: GlossaryService;

	public constructor({
		database,
		documentRepository,
		extractionItemRepository,
		glossaryService,
	}: Constructor) {
		this.database = database;
		this.documentRepository = documentRepository;
		this.extractionItemRepository = extractionItemRepository;
		this.glossaryService = glossaryService;
	}

	private async loadPages(
		document: DocumentEntity,
	): Promise<ExtractionBlock[]> {
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
		const { failedPageNumbers, items } = await extract(
			pages,
			{
				documentId,
				processingAttempt: attempt,
			},
			async (progress) => {
				await this.documentRepository.updateProcessingProgress({
					id: documentId,
					processingAttempt: attempt,
					progress,
					status: DocumentStatus.PROCESSING,
				});
			},
		);

		const isCompleted = await this.database.transaction(async (transaction) => {
			const completedDocument =
				await this.documentRepository.compareAndSwapStatus(
					{
						errorMessage: null,
						expectedStatus: DocumentStatus.PROCESSING,
						failedPageNumbers,
						id: documentId,
						processingAttempt: attempt,
						status: DocumentStatus.WAITING_FOR_VALIDATION,
					},
					transaction,
				);

			if (!completedDocument) {
				return false;
			}

			await this.extractionItemRepository.replacePending(
				{ documentId, items },
				transaction,
			);

			return true;
		});

		if (isCompleted) {
			void this.glossaryService.addTermsFromDocument({
				content: pages.map(({ content }) => content).join(PAGE_TEXT_SEPARATOR),
				documentId,
				projectId: document.toObject().projectId,
			});
		}

		return isCompleted;
	}
}

export { DocumentProcessor };
