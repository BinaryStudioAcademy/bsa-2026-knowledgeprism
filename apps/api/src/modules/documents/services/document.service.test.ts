import "~/test-setup.js";

import { DocumentErrorMessage } from "@knowledgeprism/constants";
import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { type Logger } from "~/infrastructure/logger/logger.js";
import { ProcessingSweep } from "~/modules/documents/libs/constants/processing-sweep.constant.js";
import { type DocumentRepository } from "~/modules/documents/repositories/document.repository.js";
import { type ExtractionItemRepository } from "~/modules/documents/repositories/extraction-item.repository.js";
import { type ProjectService } from "~/modules/projects/services/project.service.js";

import { type DocumentJobScheduler } from "./document-job-scheduler.js";
import { DocumentService } from "./document.service.js";

const FAILED_DOCUMENT_COUNT = 1;
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
