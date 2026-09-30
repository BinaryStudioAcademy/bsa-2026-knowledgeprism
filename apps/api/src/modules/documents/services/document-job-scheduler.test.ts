import {
	DocumentErrorMessage,
	DocumentStatus,
} from "@knowledgeprism/constants";
import { type ValueOf } from "@knowledgeprism/types";
import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { type Logger } from "~/infrastructure/logger/logger.js";
import { ProcessingSweep } from "~/modules/documents/libs/constants/processing-sweep.constant.js";
import { DocumentProcessingError } from "~/modules/documents/libs/exceptions/document-processing.exception.js";
import { type ProcessingAttempt } from "~/modules/documents/libs/types/processing-attempt.type.js";
import { type DocumentRepository } from "~/modules/documents/repositories/document.repository.js";

import { DocumentJobScheduler } from "./document-job-scheduler.js";
import { type DocumentProcessor } from "./document-processor.js";
import { type IntegrationAnalyzer } from "./integration-analyzer.js";

const ATTEMPT = 2;
const DOCUMENT_ID = 7;
const NO_CALLS = 0;
const SINGLE_CALL = 1;
const TWO_CALLS = 2;

const PROCESSING_ATTEMPT: ProcessingAttempt = {
	attempt: ATTEMPT,
	documentId: DOCUMENT_ID,
};

type CompareAndSwapParameters = {
	errorMessage: null | string;
	expectedStatus: ValueOf<typeof DocumentStatus>;
	id: number;
	processingAttempt?: number;
	status: ValueOf<typeof DocumentStatus>;
};

type Deferred<T> = {
	promise: Promise<T>;
	reject: (error: unknown) => void;
	resolve: (value: T) => void;
};

type HeartbeatParameters = {
	expectedStatus: ValueOf<typeof DocumentStatus>;
	id: number;
	processingAttempt: number;
};

const createDeferred = <T>(): Deferred<T> => {
	const { promise, reject, resolve } = Promise.withResolvers<T>();

	return {
		promise,
		reject,
		resolve,
	};
};

const ignoreLog = (): void => {};

const waitForScheduledWork = async (): Promise<void> => {
	await new Promise<void>((resolve) => {
		setImmediate(resolve);
	});
};

const createTestSetup = (): {
	compareAndSwapCalls: CompareAndSwapParameters[];
	getClearedCount: () => number;
	getIntervalMs: () => number | undefined;
	heartbeatCalls: HeartbeatParameters[];
	integration: Deferred<boolean>;
	processing: Deferred<boolean>;
	scheduler: DocumentJobScheduler;
	setHeartbeatError: (error: Error | null) => void;
	setIsHeartbeatCurrent: (isCurrent: boolean) => void;
	triggerHeartbeat: () => void;
} => {
	const compareAndSwapCalls: CompareAndSwapParameters[] = [];
	const heartbeatCalls: HeartbeatParameters[] = [];
	const integration = createDeferred<boolean>();
	const processing = createDeferred<boolean>();
	let clearedCount = 0;
	let heartbeatCallback: (() => void) | undefined;
	let heartbeatError: Error | null = null;
	let isHeartbeatCurrent = true;
	let intervalMs: number | undefined;
	let isIntervalActive = true;
	const intervalHandle = {} as ReturnType<typeof setInterval>;

	const documentProcessor = {
		process: (): Promise<boolean> => processing.promise,
	} as unknown as DocumentProcessor;
	const integrationAnalyzer = {
		process: (): Promise<boolean> => integration.promise,
	} as unknown as IntegrationAnalyzer;
	const documentRepository = {
		compareAndSwapStatus: (
			parameters: CompareAndSwapParameters,
		): Promise<null> => {
			compareAndSwapCalls.push(parameters);

			return Promise.resolve(null);
		},
		touchProcessingAttempt: (
			parameters: HeartbeatParameters,
		): Promise<boolean> => {
			heartbeatCalls.push(parameters);

			return heartbeatError
				? Promise.reject(heartbeatError)
				: Promise.resolve(isHeartbeatCurrent);
		},
	} as unknown as DocumentRepository;
	const logger: Logger = {
		debug: ignoreLog,
		error: ignoreLog,
		info: ignoreLog,
		warn: ignoreLog,
	};
	const scheduler = new DocumentJobScheduler({
		documentProcessor,
		documentRepository,
		integrationAnalyzer,
		intervalScheduler: {
			clear: () => {
				clearedCount++;
				isIntervalActive = false;
			},
			repeat: (callback, milliseconds) => {
				heartbeatCallback = callback;
				intervalMs = milliseconds;

				return intervalHandle;
			},
		},
		logger,
	});

	return {
		compareAndSwapCalls,
		getClearedCount: () => clearedCount,
		getIntervalMs: () => intervalMs,
		heartbeatCalls,
		integration,
		processing,
		scheduler,
		setHeartbeatError: (error) => {
			heartbeatError = error;
		},
		setIsHeartbeatCurrent: (isCurrent) => {
			isHeartbeatCurrent = isCurrent;
		},
		triggerHeartbeat: () => {
			if (!heartbeatCallback) {
				throw new Error("Heartbeat interval has not started.");
			}

			if (isIntervalActive) {
				heartbeatCallback();
			}
		},
	};
};

void describe("DocumentJobScheduler heartbeat", () => {
	void it("keeps a current processing attempt alive until it completes", async () => {
		const setup = createTestSetup();

		setup.scheduler.scheduleProcessing(PROCESSING_ATTEMPT);
		await waitForScheduledWork();

		assert.equal(setup.getIntervalMs(), ProcessingSweep.HEARTBEAT_INTERVAL_MS);

		setup.triggerHeartbeat();
		await waitForScheduledWork();
		setup.triggerHeartbeat();
		await waitForScheduledWork();

		assert.deepStrictEqual(setup.heartbeatCalls, [
			{
				expectedStatus: DocumentStatus.PROCESSING,
				id: DOCUMENT_ID,
				processingAttempt: ATTEMPT,
			},
			{
				expectedStatus: DocumentStatus.PROCESSING,
				id: DOCUMENT_ID,
				processingAttempt: ATTEMPT,
			},
		]);
		assert.equal(setup.getClearedCount(), NO_CALLS);

		setup.processing.resolve(true);
		await waitForScheduledWork();

		assert.equal(setup.getClearedCount(), SINGLE_CALL);
	});

	void it("heartbeats integration attempts with their expected status", async () => {
		const setup = createTestSetup();

		setup.scheduler.scheduleIntegration(PROCESSING_ATTEMPT);
		await waitForScheduledWork();
		setup.triggerHeartbeat();
		await waitForScheduledWork();

		assert.deepStrictEqual(setup.heartbeatCalls, [
			{
				expectedStatus: DocumentStatus.INTEGRATING,
				id: DOCUMENT_ID,
				processingAttempt: ATTEMPT,
			},
		]);

		setup.integration.resolve(true);
		await waitForScheduledWork();

		assert.equal(setup.getClearedCount(), SINGLE_CALL);
	});

	void it("stops heartbeating a superseded processing attempt", async () => {
		const setup = createTestSetup();
		setup.setIsHeartbeatCurrent(false);

		setup.scheduler.scheduleProcessing(PROCESSING_ATTEMPT);
		await waitForScheduledWork();
		setup.triggerHeartbeat();
		await waitForScheduledWork();
		setup.triggerHeartbeat();
		await waitForScheduledWork();

		assert.equal(setup.heartbeatCalls.length, SINGLE_CALL);
		assert.equal(setup.getClearedCount(), SINGLE_CALL);

		setup.processing.resolve(false);
		await waitForScheduledWork();
	});

	void it("retries heartbeat updates after a transient repository error", async () => {
		const setup = createTestSetup();
		setup.setHeartbeatError(new Error("Database unavailable"));

		setup.scheduler.scheduleProcessing(PROCESSING_ATTEMPT);
		await waitForScheduledWork();
		setup.triggerHeartbeat();
		await waitForScheduledWork();

		assert.equal(setup.getClearedCount(), NO_CALLS);

		setup.setHeartbeatError(null);
		setup.triggerHeartbeat();
		await waitForScheduledWork();

		assert.equal(setup.heartbeatCalls.length, TWO_CALLS);

		setup.processing.resolve(true);
		await waitForScheduledWork();
	});

	void it("stops the heartbeat and marks the current attempt failed when its job rejects", async () => {
		const setup = createTestSetup();

		setup.scheduler.scheduleProcessing(PROCESSING_ATTEMPT);
		await waitForScheduledWork();
		setup.processing.reject(new Error("Extraction failed"));
		await waitForScheduledWork();

		assert.deepStrictEqual(setup.compareAndSwapCalls, [
			{
				errorMessage: "Extraction failed",
				expectedStatus: DocumentStatus.PROCESSING,
				id: DOCUMENT_ID,
				processingAttempt: ATTEMPT,
				status: DocumentStatus.FAILED,
			},
		]);
		assert.equal(setup.getClearedCount(), SINGLE_CALL);
	});

	void it("stores a document processing error instead of the generic failure", async () => {
		const setup = createTestSetup();

		setup.scheduler.scheduleProcessing(PROCESSING_ATTEMPT);
		await waitForScheduledWork();
		setup.processing.reject(
			new DocumentProcessingError(DocumentErrorMessage.NO_KNOWLEDGE_EXTRACTED),
		);
		await waitForScheduledWork();

		const failureCall = setup.compareAndSwapCalls.at(0);

		assert.ok(failureCall);
		assert.equal(
			failureCall.errorMessage,
			DocumentErrorMessage.NO_KNOWLEDGE_EXTRACTED,
		);
	});
});
