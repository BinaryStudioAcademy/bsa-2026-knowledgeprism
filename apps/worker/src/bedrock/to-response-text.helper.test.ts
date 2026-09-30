import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
	BedrockResponseError,
	BedrockResponseFailure,
} from "./bedrock-response-error.exception.js";
import { toResponseText } from "./to-response-text.helper.js";

const EMPTY_OUTPUT = JSON.stringify({ items: [] });

const envelope = (stopReason: string, text: string): string =>
	JSON.stringify({
		content: [{ text, type: "text" }],
		stop_reason: stopReason,
	});

void describe("Bedrock extraction response", () => {
	void it("joins completed text blocks for all Bedrock consumers", () => {
		assert.equal(
			toResponseText(
				JSON.stringify({
					content: [
						{ text: "The answer ", type: "text" },
						{ text: "is 42.", type: "text" },
					],
					stop_reason: "end_turn",
				}),
			),
			"The answer is 42.",
		);
	});

	void it("rejects refusal even without text blocks", () => {
		assert.throws(
			() =>
				toResponseText(JSON.stringify({ content: [], stop_reason: "refusal" })),
			{
				reason: BedrockResponseFailure.REFUSAL,
			},
		);
	});

	void it("reads completed text", () => {
		assert.equal(
			toResponseText(envelope("end_turn", EMPTY_OUTPUT)),
			EMPTY_OUTPUT,
		);
	});

	for (const stopReason of ["max_tokens", "model_context_window_exceeded"]) {
		void it(`rejects ${stopReason} even when the text is valid JSON`, () => {
			assert.throws(() => toResponseText(envelope(stopReason, EMPTY_OUTPUT)), {
				name: "BedrockResponseError",
				reason: BedrockResponseFailure.TRUNCATED,
			});
		});
	}

	void it("distinguishes refusal from malformed output", () => {
		assert.throws(() => toResponseText(envelope("refusal", "")), {
			reason: BedrockResponseFailure.REFUSAL,
		});
	});

	void it("rejects invalid envelopes, empty content, and unexpected stop reasons", () => {
		for (const raw of [
			"not json",
			"null",
			"{}",
			envelope("end_turn", " "),
			envelope("tool_use", EMPTY_OUTPUT),
		]) {
			assert.throws(() => toResponseText(raw), BedrockResponseError);
		}
	});
});
