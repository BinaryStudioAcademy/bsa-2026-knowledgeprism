import {
	DocumentErrorMessage,
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

const MANUAL_TEXT_PAGE_NUMBER = 1;

type Constructor = {
	database: Database;
	documentRepository: DocumentRepository;
	extractionItemRepository: ExtractionItemRepository;
};

class DocumentProcessor {
	private database: Database;

	private documentRepository: DocumentRepository;

	private extractionItemRepository: ExtractionItemRepository;

	public constructor({
		database,
		documentRepository,
		extractionItemRepository,
	}: Constructor) {
		this.database = database;
		this.documentRepository = documentRepository;
		this.extractionItemRepository = extractionItemRepository;
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

		const pages = await this.loadPages(document);

		await this.documentRepository.compareAndSwapStatus({
			errorMessage: null,
			expectedStatus: DocumentStatus.PROCESSING,
			id: documentId,
			processingAttempt: attempt,
			status: DocumentStatus.PARSED,
		});

		await this.documentRepository.compareAndSwapStatus({
			errorMessage: null,
			expectedStatus: DocumentStatus.PARSED,
			id: documentId,
			processingAttempt: attempt,
			status: DocumentStatus.EXTRACTING,
		});

		const items = await extract(pages);

		await this.documentRepository.compareAndSwapStatus({
			errorMessage: null,
			expectedStatus: DocumentStatus.EXTRACTING,
			id: documentId,
			processingAttempt: attempt,
			status: DocumentStatus.EXTRACTED,
		});

		return await this.database.transaction(async (transaction) => {
			const completedDocument =
				await this.documentRepository.compareAndSwapStatus(
					{
						errorMessage: null,
						expectedStatus: DocumentStatus.EXTRACTED,
						id: documentId,
						processingAttempt: attempt,
						status: DocumentStatus.WAITING_FOR_APPROVAL,
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
	}
}

export { DocumentProcessor };
