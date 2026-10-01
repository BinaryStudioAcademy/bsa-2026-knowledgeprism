import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { formatSuggestedQuestion } from "./format-suggested-question.helper.js";

const EMPTY_REPEAT_COUNT = 3;

void describe("formatSuggestedQuestion", () => {
	void it("formats action statement clauses with how and inserts missing article", () => {
		const formatted = formatSuggestedQuestion(
			"KnowledgePrism converts scattered docs into unified knowledge base",
		);

		assert.strictEqual(
			formatted,
			"Tell me about how KnowledgePrism converts scattered docs into a unified knowledge base",
		);
	});

	void it("formats statement clauses containing a verb with how", () => {
		const formatted = formatSuggestedQuestion(
			"KnowledgePrism ensures a single source of truth",
		);

		assert.strictEqual(
			formatted,
			"Tell me about how KnowledgePrism ensures a single source of truth",
		);
	});

	void it("formats noun phrases without how", () => {
		const formatted = formatSuggestedQuestion("Authentication Architecture");

		assert.strictEqual(formatted, "Tell me about Authentication Architecture");
	});

	void it("formats titles starting with How correctly", () => {
		const formatted = formatSuggestedQuestion("How the worker processes jobs");

		assert.strictEqual(
			formatted,
			"Tell me about how the worker processes jobs",
		);
	});

	void it("preserves question format for questions starting with What", () => {
		const formatted = formatSuggestedQuestion("What is Ask Prism");

		assert.strictEqual(formatted, "What is Ask Prism?");
	});

	void it("preserves titles that already start with Tell me about", () => {
		const formatted = formatSuggestedQuestion(
			"Tell me about system deployment",
		);

		assert.strictEqual(formatted, "Tell me about system deployment");
	});

	void it("returns empty string when given empty title", () => {
		const formatted = formatSuggestedQuestion(" ".repeat(EMPTY_REPEAT_COUNT));

		assert.strictEqual(formatted, "");
	});
});
