import { IntegrationChangeType } from "@knowledgeprism/constants";
import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { type IntegrationAnalysisResult } from "../types/integration-analysis-result.type.js";
import { createAutoNewResult } from "./create-auto-new-result.helper.js";
import {
	ClassificationRecovery,
	resolveClassification,
} from "./resolve-classification.helper.js";

const PARSED_RESULT: IntegrationAnalysisResult<string> = {
	...createAutoNewResult<string>(),
	explanation: "Parsed classification.",
	type: IntegrationChangeType.UPDATE,
};
const VALID_OUTPUT = "valid";
const NO_OUTPUTS_LEFT = 0;

const toResult = (raw: unknown): IntegrationAnalysisResult<string> | null =>
	raw === VALID_OUTPUT ? PARSED_RESULT : null;

void describe("resolveClassification", () => {
	void it("returns the first parsable classification", async () => {
		let calls = 0;
		const result = await resolveClassification({
			fallback: () => createAutoNewResult<string>(),
			invoke: () => {
				calls++;

				return Promise.resolve(VALID_OUTPUT);
			},
			map: toResult,
			onUnparsable: () => {},
		});

		assert.equal(result, PARSED_RESULT);
		assert.equal(calls, ClassificationRecovery.FIRST_ATTEMPT);
	});

	void it("retries an unparsable classification", async () => {
		const outputs = ["{broken", VALID_OUTPUT];
		const unparsableAttempts: number[] = [];
		const result = await resolveClassification({
			fallback: () => createAutoNewResult<string>(),
			invoke: () => Promise.resolve(outputs.shift()),
			map: toResult,
			onUnparsable: (attempt) => {
				unparsableAttempts.push(attempt);
			},
		});

		assert.equal(result, PARSED_RESULT);
		assert.deepEqual(unparsableAttempts, [
			ClassificationRecovery.FIRST_ATTEMPT,
		]);
		assert.equal(outputs.length, NO_OUTPUTS_LEFT);
	});

	void it("falls back to a new section after the last unparsable attempt", async () => {
		let calls = 0;
		const fallback = createAutoNewResult<string>();
		const result = await resolveClassification({
			fallback: () => fallback,
			invoke: () => {
				calls++;

				return Promise.resolve("{broken");
			},
			map: toResult,
			onUnparsable: () => {},
		});

		assert.equal(result, fallback);
		assert.equal(result.type, IntegrationChangeType.NEW);
		assert.equal(calls, ClassificationRecovery.MAXIMUM_ATTEMPTS);
	});
});
