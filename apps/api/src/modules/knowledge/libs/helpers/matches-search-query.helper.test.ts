import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
	isMatchingSearchQuery,
	type SearchableNode,
} from "./matches-search-query.helper.js";

const buildNode = (title: string, text: string): SearchableNode => {
	return {
		contentJson: [
			{
				content: [{ text, type: "text" }],
				type: "paragraph",
			},
		],
		title,
	};
};

void describe("isMatchingSearchQuery", () => {
	void it("matches when the title contains the query", () => {
		const node = buildNode("Opening hours", "The office opens at 9:00.");

		assert.equal(isMatchingSearchQuery(node, "opening"), true);
	});

	void it("matches when the content contains the query", () => {
		const node = buildNode("Opening hours", "The office opens at 9:00.");

		assert.equal(isMatchingSearchQuery(node, "9:00"), true);
	});

	void it("does not match block structure keys instead of real content", () => {
		// Regression: before flattening the content, `content_json::text ILIKE` matched
		// the literal JSON keys "text"/"type"/"content", so every entry matched them.
		const node = buildNode("Opening hours", "The office opens at 9:00.");

		assert.equal(isMatchingSearchQuery(node, "type"), false);
		assert.equal(isMatchingSearchQuery(node, "content"), false);
	});

	void it("matches the word 'text' only when it is actually in the content", () => {
		const node = buildNode("Glossary", "See the full text of the policy.");

		assert.equal(isMatchingSearchQuery(node, "text"), true);
	});

	void it("does not match an unrelated query", () => {
		const node = buildNode("Opening hours", "The office opens at 9:00.");

		assert.equal(isMatchingSearchQuery(node, "parking"), false);
	});

	void it("matches a mixed-case title against a lowercase query", () => {
		// The caller (the repository) lowercases the query before calling this helper.
		const node = buildNode("Opening Hours", "The office opens at 9:00.");

		assert.equal(isMatchingSearchQuery(node, "opening hours"), true);
	});
});
