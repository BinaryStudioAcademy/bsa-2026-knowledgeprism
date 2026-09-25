import {
	DeleteObjectsCommand,
	ListObjectsV2Command,
	type S3Client,
} from "@aws-sdk/client-s3";
import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { type Logger } from "~/infrastructure/logger/logger.js";
import { type DeleteObjectsByPrefix } from "~/infrastructure/s3/delete-objects.js";
import { deleteObjectsByPrefix } from "~/infrastructure/s3/libs/helpers/helpers.js";

import { ProjectStorageCleanupService } from "./project-storage-cleanup.service.js";

const BUCKET_NAME = "test-bucket";
const DELETED_OBJECTS_COUNT = 5;
const EXPECTED_BATCHES_COUNT = 2;
const EXPECTED_CLEANUP_CALLS_COUNT = 2;
const FIRST_CALL = 1;
const FIRST_PAGE_COUNT = 2;
const INCREMENT = 1;
const INITIAL_RETRY_DELAY_MS = 1;
const LATE_UPLOAD_SWEEP_MULTIPLIER = 2;
const MAX_RETRIES = 3;
const PROJECT_ID = 42;
const SECOND_PAGE_COUNT = 1;
const TEST_DELAYED_SWEEP_DELAY_MS = 10;
const TOTAL_PAGINATED_COUNT = FIRST_PAGE_COUNT + SECOND_PAGE_COUNT;
const ZERO_COUNT = 0;

const mockLogger = {
	error: () => {},
	info: () => {},
	warn: () => {},
} as unknown as Logger;

void describe("deleteObjectsByPrefix", () => {
	void it("returns zero when no objects match prefix", async () => {
		const mockS3 = {
			send: (command: unknown) => {
				if (command instanceof ListObjectsV2Command) {
					return Promise.resolve({ Contents: [] });
				}

				return Promise.reject(new Error("Unexpected command"));
			},
		} as unknown as S3Client;

		const deleted = await deleteObjectsByPrefix({
			bucketName: BUCKET_NAME,
			prefix: `projects/${PROJECT_ID.toString()}/`,
			s3Client: mockS3,
		});

		assert.strictEqual(deleted, ZERO_COUNT);
	});

	void it("deletes all objects across paginated results", async () => {
		let listCalls = 0;
		const deletedBatches: string[][] = [];

		const mockS3 = {
			send: (command: unknown) => {
				if (command instanceof ListObjectsV2Command) {
					listCalls += INCREMENT;
					if (listCalls === FIRST_CALL) {
						return Promise.resolve({
							Contents: [
								{ Key: "projects/42/docs/file1.pdf" },
								{ Key: "projects/42/docs/file2.pdf" },
							],
							NextContinuationToken: "token-page-2",
						});
					}

					return Promise.resolve({
						Contents: [{ Key: "projects/42/docs/file3.pdf" }],
					});
				}

				if (command instanceof DeleteObjectsCommand) {
					const keys =
						command.input.Delete?.Objects?.flatMap((o) =>
							o.Key ? [o.Key] : [],
						) ?? [];
					deletedBatches.push(keys);

					return Promise.resolve({ Deleted: keys.map((Key) => ({ Key })) });
				}

				return Promise.reject(new Error("Unexpected command"));
			},
		} as unknown as S3Client;

		const deleted = await deleteObjectsByPrefix({
			bucketName: BUCKET_NAME,
			prefix: `projects/${PROJECT_ID.toString()}/`,
			s3Client: mockS3,
		});

		assert.strictEqual(deleted, TOTAL_PAGINATED_COUNT);
		assert.strictEqual(deletedBatches.length, EXPECTED_BATCHES_COUNT);
	});
});

void describe("ProjectStorageCleanupService", () => {
	void it("deletes objects under project prefix successfully", async () => {
		const deletedPrefixes: string[] = [];
		const mockDelete: DeleteObjectsByPrefix = ({ prefix }) => {
			deletedPrefixes.push(prefix);

			return Promise.resolve(DELETED_OBJECTS_COUNT);
		};

		const service = new ProjectStorageCleanupService({
			deleteObjectsByPrefix: mockDelete,
			logger: mockLogger,
		});

		const wasSuccess = await service.cleanupProjectStorage(PROJECT_ID);

		assert.strictEqual(wasSuccess, true);
		assert.deepStrictEqual(deletedPrefixes, [
			`projects/${PROJECT_ID.toString()}/`,
		]);
	});

	void it("retries on transient failure and succeeds", async () => {
		let attempts = 0;
		const mockDelete: DeleteObjectsByPrefix = () => {
			attempts += INCREMENT;
			if (attempts < MAX_RETRIES) {
				return Promise.reject(new Error("Transient S3 error"));
			}

			return Promise.resolve(DELETED_OBJECTS_COUNT);
		};

		const service = new ProjectStorageCleanupService({
			deleteObjectsByPrefix: mockDelete,
			initialRetryDelayMs: INITIAL_RETRY_DELAY_MS,
			logger: mockLogger,
			maxRetries: MAX_RETRIES,
		});

		const wasSuccess = await service.cleanupProjectStorage(PROJECT_ID);

		assert.strictEqual(wasSuccess, true);
		assert.strictEqual(attempts, MAX_RETRIES);
	});

	void it("returns false when all retries fail", async () => {
		let attempts = 0;
		const mockDelete: DeleteObjectsByPrefix = () => {
			attempts += INCREMENT;

			return Promise.reject(new Error("Permanent S3 failure"));
		};

		const service = new ProjectStorageCleanupService({
			deleteObjectsByPrefix: mockDelete,
			initialRetryDelayMs: INITIAL_RETRY_DELAY_MS,
			logger: mockLogger,
			maxRetries: MAX_RETRIES,
		});

		const wasSuccess = await service.cleanupProjectStorage(PROJECT_ID);

		assert.strictEqual(wasSuccess, false);
		assert.strictEqual(attempts, MAX_RETRIES);
	});

	void it("executes delayed sweep to clean up late presigned URL uploads", async () => {
		const cleanupCalls: number[] = [];
		const mockDelete: DeleteObjectsByPrefix = () => {
			cleanupCalls.push(Date.now());

			return Promise.resolve(ZERO_COUNT);
		};

		const service = new ProjectStorageCleanupService({
			delayedSweepDelayMs: TEST_DELAYED_SWEEP_DELAY_MS,
			deleteObjectsByPrefix: mockDelete,
			logger: mockLogger,
		});

		service.scheduleCleanup(PROJECT_ID);

		await new Promise((resolve) => {
			setTimeout(
				resolve,
				TEST_DELAYED_SWEEP_DELAY_MS * LATE_UPLOAD_SWEEP_MULTIPLIER,
			);
		});

		assert.strictEqual(cleanupCalls.length, EXPECTED_CLEANUP_CALLS_COUNT);
	});
});
