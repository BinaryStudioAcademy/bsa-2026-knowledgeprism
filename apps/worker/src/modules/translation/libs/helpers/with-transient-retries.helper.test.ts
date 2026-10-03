import {
	AccessDeniedException,
	ThrottlingException,
} from "@aws-sdk/client-bedrock-runtime";
import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { ExtractionRecovery } from "~/modules/knowledge-extraction/libs/constants/extraction-recovery.constant.js";

import { withTransientRetries } from "./with-transient-retries.helper.js";

const SINGLE_CALL = 1;
const TRANSLATION = "Translated text";

const throttled = (): ThrottlingException =>
	new ThrottlingException({ $metadata: {}, message: "Slow down" });

const createCounter = (
	failures: number,
	toError: () => Error,
): { calls: () => number; operation: () => Promise<string> } => {
	let count = 0;

	return {
		calls: () => count,
		operation: () => {
			count++;

			return count <= failures
				? Promise.reject(toError())
				: Promise.resolve(TRANSLATION);
		},
	};
};

const noPause = (): Promise<void> => Promise.resolve();

void describe("withTransientRetries", () => {
	void it("retries a throttled request and returns its result", async () => {
		const counter = createCounter(SINGLE_CALL, throttled);

		assert.equal(
			await withTransientRetries(counter.operation, noPause),
			TRANSLATION,
		);
		assert.equal(counter.calls(), SINGLE_CALL + SINGLE_CALL);
	});

	void it("does not retry a permanent error", async () => {
		const counter = createCounter(
			SINGLE_CALL,
			() => new AccessDeniedException({ $metadata: {}, message: "Denied" }),
		);

		await assert.rejects(withTransientRetries(counter.operation, noPause));
		assert.equal(counter.calls(), SINGLE_CALL);
	});

	void it("gives up after the maximum number of attempts", async () => {
		const counter = createCounter(
			ExtractionRecovery.MAXIMUM_ATTEMPTS,
			throttled,
		);

		await assert.rejects(withTransientRetries(counter.operation, noPause));
		assert.equal(counter.calls(), ExtractionRecovery.MAXIMUM_ATTEMPTS);
	});
});
