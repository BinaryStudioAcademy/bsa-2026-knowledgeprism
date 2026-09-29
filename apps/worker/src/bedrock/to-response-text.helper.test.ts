import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { BedrockStopReason } from "./bedrock-stop-reason.constant.js";
import { toResponseText } from "./to-response-text.helper.js";

const toEnvelope = (stopReason: string, texts: string[]): string =>
	JSON.stringify({
		content: texts.map((text) => ({ text, type: "text" })),
		stop_reason: stopReason,
	});

void describe("toResponseText", () => {
	void it("joins the text blocks of a complete response", () => {
		assert.equal(
			toResponseText(toEnvelope("end_turn", ["The answer ", "is 42."])),
			"The answer is 42.",
		);
	});

	void it("throws when the response was cut off at max_tokens", () => {
		assert.throws(
			() =>
				toResponseText(
					toEnvelope(BedrockStopReason.MAX_TOKENS, ["The answer is"]),
				),
			/truncated at the max_tokens limit/u,
		);
	});

	void it("returns an empty string for a body that is not JSON", () => {
		assert.equal(toResponseText("not json"), "");
	});
});
