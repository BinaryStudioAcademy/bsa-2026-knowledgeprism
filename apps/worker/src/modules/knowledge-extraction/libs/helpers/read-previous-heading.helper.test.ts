import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { type KnowledgeItem } from "../types/knowledge-item.type.js";
import { readPreviousHeading } from "./read-previous-heading.helper.js";

const SECTION_HEADING = "Installation";

const itemEndingOn = (
	blockText: string,
	blockType: "heading" | "paragraph",
): KnowledgeItem => {
	return {
		blocks: [
			{
				content: [{ text: SECTION_HEADING, type: "text" }],
				props: { level: 2 },
				type: "heading",
			},
			{
				content: [{ text: blockText, type: "text" }],
				...(blockType === "heading" && { props: { level: 3 } }),
				type: blockType,
			},
		],
		confidence: 1,
		heading: SECTION_HEADING,
		position: 0,
		rationale: "Extracted from the source section.",
		sourceExcerpt: blockText,
		sourcePageNumber: 1,
		text: blockText,
		title: SECTION_HEADING,
	};
};

void describe("readPreviousHeading", () => {
	void it("uses a markdown heading when the chunk ends on one", () => {
		const heading = readPreviousHeading("Body\n\n## How it works\n", []);

		assert.equal(heading, "How it works");
	});

	void it("uses the open section heading when the chunk ends on a heading block", () => {
		const heading = readPreviousHeading("Installation\nSetup", [
			itemEndingOn("Setup", "heading"),
		]);

		assert.equal(heading, SECTION_HEADING);
	});

	void it("returns null when the chunk ends on a paragraph", () => {
		const heading = readPreviousHeading("Installation\nThe limit is 10.", [
			itemEndingOn("The limit is 10.", "paragraph"),
		]);

		assert.equal(heading, null);
	});
});
