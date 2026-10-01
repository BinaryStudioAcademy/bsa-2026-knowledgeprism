import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { type Logger } from "~/infrastructure/logger/logger.js";
import { type ProjectStorageCleanupRepository } from "~/modules/projects/repositories/project-storage-cleanup.repository.js";

import { ProjectStorageCleanupService } from "./project-storage-cleanup.service.js";

const NO_DELETED_OBJECTS = 0;
const SINGLE_CALL = 1;

const ignoreLog = (): void => {};

void describe("ProjectStorageCleanupService.processDueCleanups", () => {
	void it("logs a database failure instead of rejecting", async () => {
		const errors: string[] = [];
		const projectStorageCleanupRepository = {
			findDueCleanups: (): Promise<never> =>
				Promise.reject(new Error("Connection terminated")),
		} as unknown as ProjectStorageCleanupRepository;
		const logger: Logger = {
			debug: ignoreLog,
			error: (message: string): void => {
				errors.push(message);
			},
			info: ignoreLog,
			warn: ignoreLog,
		};
		const service = new ProjectStorageCleanupService({
			deleteObjectsByPrefix: () => Promise.resolve(NO_DELETED_OBJECTS),
			logger,
			projectStorageCleanupRepository,
		});

		await assert.doesNotReject(service.processDueCleanups());
		assert.equal(errors.length, SINGLE_CALL);
	});
});
