import {
	DocumentErrorMessage,
	DocumentSourceType,
	DocumentStatus,
} from "@knowledgeprism/constants";
import { type ValueOf } from "@knowledgeprism/types";
import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { HTTPCode, HTTPError } from "~/infrastructure/http/http.js";
import { type Logger } from "~/infrastructure/logger/logger.js";
import { CANCELLABLE_DOCUMENT_STATUSES } from "~/modules/documents/libs/constants/cancellable-document-statuses.constant.js";
import { ProcessingSweep } from "~/modules/documents/libs/constants/processing-sweep.constant.js";
import { DocumentEntity } from "~/modules/documents/models/document.entity.js";
import { type DocumentRepository } from "~/modules/documents/repositories/document.repository.js";
import { type ExtractionItemRepository } from "~/modules/documents/repositories/extraction-item.repository.js";
import { type ProjectService } from "~/modules/projects/services/project.service.js";

import { type DocumentJobScheduler } from "./document-job-scheduler.js";
import { DocumentService } from "./document.service.js";

const DOCUMENT_ID = 31;
const FAILED_DOCUMENT_COUNT = 1;
const PROJECT_ID = 4;
const SINGLE_CALL = 1;

type FailStaleProcessingParameters = {
	errorMessage: string;
	updatedBefore: Date;
};

const ignoreLog = (): void => {};

void describe("DocumentService.failStaleProcessing", () => {
	void it("continues to fail interrupted jobs after their heartbeat stops", async () => {
		const failStaleProcessingCalls: FailStaleProcessingParameters[] = [];
		const warnings: Record<string, unknown>[] = [];
		const documentRepository = {
			failStaleProcessing: (
				parameters: FailStaleProcessingParameters,
			): Promise<number> => {
				failStaleProcessingCalls.push(parameters);

				return Promise.resolve(FAILED_DOCUMENT_COUNT);
			},
		} as unknown as DocumentRepository;
		const logger: Logger = {
			debug: ignoreLog,
			error: ignoreLog,
			info: ignoreLog,
			warn: (_message, parameters = {}) => {
				warnings.push(parameters);
			},
		};
		const service = new DocumentService({
			checkDocumentObjectExists: () => Promise.resolve(null),
			documentJobScheduler: {} as DocumentJobScheduler,
			documentRepository,
			extractionItemRepository: {} as ExtractionItemRepository,
			generatePresignedUploadUrl: () => Promise.resolve("test-upload-url"),
			logger,
			projectService: {} as ProjectService,
		});
		const earliestCutoff = Date.now() - ProcessingSweep.STALE_AFTER_MS;

		await service.failStaleProcessing();

		const latestCutoff = Date.now() - ProcessingSweep.STALE_AFTER_MS;
		assert.equal(failStaleProcessingCalls.length, SINGLE_CALL);
		const [call] = failStaleProcessingCalls;
		assert.ok(call);
		assert.equal(
			call.errorMessage,
			DocumentErrorMessage.PROCESSING_INTERRUPTED,
		);
		assert.ok(call.updatedBefore.getTime() >= earliestCutoff);
		assert.ok(call.updatedBefore.getTime() <= latestCutoff);
		assert.deepStrictEqual(warnings, [{ failedCount: FAILED_DOCUMENT_COUNT }]);
	});
});

type StatusUpdate = {
	allowedStatuses: ValueOf<typeof DocumentStatus>[];
	errorMessage: null | string;
	id: number;
	status: ValueOf<typeof DocumentStatus>;
};

const createDocument = (
	status: ValueOf<typeof DocumentStatus>,
): DocumentEntity =>
	DocumentEntity.initialize({
		content: null,
		contentHash: "hash",
		createdAt: new Date(),
		errorMessage: null,
		failedPageNumbers: [],
		id: DOCUMENT_ID,
		mimeType: "application/pdf",
		name: "source.pdf",
		processingAttempt: 1,
		processingProgress: null,
		projectId: PROJECT_ID,
		s3Key: null,
		sizeInBytes: null,
		sourceType: DocumentSourceType.UPLOAD,
		status,
		updatedAt: new Date(),
		uploadedBy: null,
	});

const createCancelSetup = (
	currentStatus: ValueOf<typeof DocumentStatus>,
): { service: DocumentService; updates: StatusUpdate[] } => {
	const updates: StatusUpdate[] = [];
	const documentRepository = {
		findByIdAndProjectId: () => Promise.resolve(createDocument(currentStatus)),
		updateStatusIfCurrentIn: (update: StatusUpdate) => {
			updates.push(update);

			return Promise.resolve(
				update.allowedStatuses.includes(currentStatus)
					? createDocument(update.status)
					: null,
			);
		},
	} as unknown as DocumentRepository;
	const service = new DocumentService({
		checkDocumentObjectExists: () => Promise.resolve(null),
		documentJobScheduler: {} as DocumentJobScheduler,
		documentRepository,
		extractionItemRepository: {} as ExtractionItemRepository,
		generatePresignedUploadUrl: () => Promise.resolve("test-upload-url"),
		logger: {
			debug: ignoreLog,
			error: ignoreLog,
			info: ignoreLog,
			warn: ignoreLog,
		},
		projectService: {
			assertCanWriteKnowledge: () => Promise.resolve(),
		} as unknown as ProjectService,
	});

	return { service, updates };
};

const cancel = (service: DocumentService) =>
	service.cancelProcessing({
		context: { organisationId: 1, userId: 1 },
		documentId: DOCUMENT_ID,
		projectId: PROJECT_ID,
	});

void describe("DocumentService.cancelProcessing", () => {
	for (const status of CANCELLABLE_DOCUMENT_STATUSES) {
		void it(`cancels a document that is ${status}`, async () => {
			const { service, updates } = createCancelSetup(status);

			const response = await cancel(service);

			assert.equal(response.status, DocumentStatus.CANCELLED);
			assert.deepStrictEqual(updates, [
				{
					allowedStatuses: CANCELLABLE_DOCUMENT_STATUSES,
					errorMessage: null,
					id: DOCUMENT_ID,
					status: DocumentStatus.CANCELLED,
				},
			]);
		});
	}

	for (const status of [
		DocumentStatus.APPROVED,
		DocumentStatus.CANCELLED,
		DocumentStatus.COMPLETED,
	]) {
		void it(`refuses to cancel a document that is ${status}`, async () => {
			const { service } = createCancelSetup(status);

			await assert.rejects(
				cancel(service),
				(error: unknown) =>
					error instanceof HTTPError &&
					error.status === HTTPCode.CONFLICT &&
					error.message === DocumentErrorMessage.CANCEL_NOT_ALLOWED,
			);
		});
	}
});
