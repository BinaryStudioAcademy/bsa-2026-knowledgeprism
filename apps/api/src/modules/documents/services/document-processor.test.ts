import "~/test-setup.js";

import {
	DocumentErrorMessage,
	DocumentSourceType,
	DocumentStatus,
} from "@knowledgeprism/constants";
import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { type Database } from "~/infrastructure/database/database.js";
import { type Logger } from "~/infrastructure/logger/logger.js";
import { DocumentProcessingError } from "~/modules/documents/libs/exceptions/document-processing.exception.js";
import { DocumentEntity } from "~/modules/documents/models/document.entity.js";
import { type DocumentRepository } from "~/modules/documents/repositories/document.repository.js";
import { type ExtractionItemRepository } from "~/modules/documents/repositories/extraction-item.repository.js";
import { type ExtractionRunRepository } from "~/modules/documents/repositories/extraction-run.repository.js";
import { type GlossaryService } from "~/modules/glossary/services/glossary.service.js";

import { DocumentProcessor } from "./document-processor.js";

const DOCUMENT_ID = 101;
const EXTRACTION_CHUNK_LENGTH = 1000;
const PROCESSING_ATTEMPT = 1;
const PROJECT_ID = 5;
const USER_ID = 1;

const createManualDocument = (content: null | string): DocumentEntity => {
	return DocumentEntity.initialize({
		content,
		contentHash: "hash-101",
		createdAt: new Date("2026-10-02T00:00:00.000Z"),
		errorMessage: null,
		failedPageNumbers: [],
		id: DOCUMENT_ID,
		mimeType: "text/plain",
		name: "test-document.txt",
		processingAttempt: PROCESSING_ATTEMPT,
		processingProgress: null,
		projectId: PROJECT_ID,
		s3Key: null,
		sizeInBytes: null,
		sourceType: DocumentSourceType.MANUAL,
		status: DocumentStatus.PROCESSING,
		updatedAt: new Date("2026-10-02T00:00:00.000Z"),
		uploadedBy: USER_ID,
	});
};

const createProcessor = (document: DocumentEntity): DocumentProcessor => {
	const documentRepository = {
		findById: (): Promise<DocumentEntity | null> => Promise.resolve(document),
		updateProcessingProgress: (): Promise<boolean> => Promise.resolve(true),
	} as unknown as DocumentRepository;

	return new DocumentProcessor({
		database: {} as Database,
		documentRepository,
		extractionChunkLength: EXTRACTION_CHUNK_LENGTH,
		extractionItemRepository: {} as ExtractionItemRepository,
		extractionRunRepository: {} as ExtractionRunRepository,
		glossaryService: {} as GlossaryService,
		logger: {} as Logger,
	});
};

void describe("DocumentProcessor.process", () => {
	void it("throws NO_EXTRACTABLE_TEXT when document content has only whitespace", async () => {
		const document = createManualDocument("   \n\t   ");
		const processor = createProcessor(document);

		await assert.rejects(
			async () => {
				await processor.process({
					attempt: PROCESSING_ATTEMPT,
					documentId: DOCUMENT_ID,
				});
			},
			(error: unknown) => {
				assert.ok(error instanceof DocumentProcessingError);
				assert.equal(
					error.documentErrorMessage,
					DocumentErrorMessage.NO_EXTRACTABLE_TEXT,
				);

				return true;
			},
		);
	});

	void it("throws NO_EXTRACTABLE_TEXT when document content is null", async () => {
		const document = createManualDocument(null);
		const processor = createProcessor(document);

		await assert.rejects(
			async () => {
				await processor.process({
					attempt: PROCESSING_ATTEMPT,
					documentId: DOCUMENT_ID,
				});
			},
			(error: unknown) => {
				assert.ok(error instanceof DocumentProcessingError);
				assert.equal(
					error.documentErrorMessage,
					DocumentErrorMessage.NO_EXTRACTABLE_TEXT,
				);

				return true;
			},
		);
	});
});
