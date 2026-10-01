import { DocumentProcessingPhase } from "@knowledgeprism/constants";
import { type DocumentProcessingProgressDto } from "@knowledgeprism/types";
import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { ProcessingSupersededError } from "~/modules/documents/libs/exceptions/processing-superseded-error.exception.js";

import { createOrderedProgressReporter } from "./create-ordered-progress-reporter.helper.js";

const FIRST_UNITS = 1;
const SECOND_UNITS = 2;
const TOTAL_UNITS = 3;

const toProgress = (processedUnits: number): DocumentProcessingProgressDto => ({
	failedUnits: 0,
	phase: DocumentProcessingPhase.INTEGRATING,
	processedUnits,
	totalUnits: TOTAL_UNITS,
});

void describe("createOrderedProgressReporter", () => {
	void it("saves reports one at a time and skips ones older than the last", async () => {
		const saved: number[] = [];
		const report = createOrderedProgressReporter((progress) => {
			saved.push(progress.processedUnits);

			return Promise.resolve(true);
		});

		await Promise.all([
			report(toProgress(SECOND_UNITS)),
			report(toProgress(FIRST_UNITS)),
			report(toProgress(TOTAL_UNITS)),
		]);

		assert.deepEqual(saved, [SECOND_UNITS, TOTAL_UNITS]);
	});

	void it("stops the attempt when a report is refused", async () => {
		const report = createOrderedProgressReporter(() => Promise.resolve(false));

		await assert.rejects(
			report(toProgress(FIRST_UNITS)),
			ProcessingSupersededError,
		);
	});
});
