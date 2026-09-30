import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { isTransientExtractionError } from "./is-transient-extraction-error.helper.js";

const RETRYABLE_NETWORK_CODES = [
	"EAI_AGAIN",
	"ECONNREFUSED",
	"ECONNRESET",
	"EHOSTUNREACH",
	"ENETUNREACH",
	"ENOTFOUND",
	"EPIPE",
	"ETIMEDOUT",
];

void describe("isTransientExtractionError", () => {
	for (const code of RETRYABLE_NETWORK_CODES) {
		void it(`recognizes the transport code ${code} without HTTP metadata`, () => {
			const error = Object.assign(new Error("Network failure"), { code });
			assert.equal(isTransientExtractionError(error), true);
		});
	}

	void it("does not retry permanent or unrecognized failures", () => {
		for (const error of [
			null,
			"failure",
			new Error("Unknown failure"),
			{ code: "ENOENT" },
			{ $metadata: { httpStatusCode: 403 }, name: "AccessDeniedException" },
			{ $metadata: { httpStatusCode: 400 }, name: "ValidationException" },
		]) {
			assert.equal(isTransientExtractionError(error), false);
		}
	});
});
