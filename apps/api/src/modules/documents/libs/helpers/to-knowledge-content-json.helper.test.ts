import {
	type ExtractionContentBlock,
	ExtractionHeadingLevel,
} from "@knowledgeprism/types";
import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { toKnowledgeContentJson } from "./to-knowledge-content-json.helper.js";

const PAGE_TITLE = "Core Capabilities";
const FALLBACK_TEXT = "Plain fallback";
const CALLOUT_INDEX = 0;
const NESTED_HEADING_INDEX = 1;
const CHECKLIST_INDEX = 3;
const ONLY_BLOCK_INDEX = 0;

const sectionBlocks = (): ExtractionContentBlock[] => [
	{
		content: [{ text: PAGE_TITLE, type: "text" }],
		props: { level: ExtractionHeadingLevel.SECTION },
		type: "heading",
	},
	{
		content: [
			{
				styles: { backgroundColor: "yellow", bold: true },
				text: "Decision",
				type: "text",
			},
			{ text: ": keep the source structure", type: "text" },
		],
		type: "paragraph",
	},
	{
		content: [{ text: "Knowledge Base", type: "text" }],
		props: { level: ExtractionHeadingLevel.NESTED },
		type: "heading",
	},
	{
		content: [{ styles: { bold: true }, text: "Stores", type: "text" }],
		type: "bulletListItem",
	},
	{
		content: [{ text: "Confirm the page", type: "text" }],
		props: { checked: false },
		type: "checkListItem",
	},
];

void describe("toKnowledgeContentJson", () => {
	void it("keeps headings, lists, checklists, and callout lead-ins", () => {
		const content = toKnowledgeContentJson({
			blocks: sectionBlocks(),
			fallbackText: FALLBACK_TEXT,
			title: PAGE_TITLE,
		});

		const callout = content[CALLOUT_INDEX];
		const nestedHeading = content[NESTED_HEADING_INDEX];
		const checklist = content[CHECKLIST_INDEX];

		assert.deepEqual(
			content.map((block) => block["type"]),
			["paragraph", "heading", "bulletListItem", "checkListItem"],
		);
		assert.ok(callout);
		assert.ok(nestedHeading);
		assert.ok(checklist);
		assert.deepEqual(callout["content"], [
			{
				styles: { backgroundColor: "yellow", bold: true },
				text: "Decision",
				type: "text",
			},
			{
				styles: {},
				text: ": keep the source structure",
				type: "text",
			},
		]);
		assert.deepEqual(nestedHeading["props"], {
			level: ExtractionHeadingLevel.NESTED,
		});
		assert.deepEqual(checklist["props"], { checked: false });
	});

	void it("keeps a heading that is not the page title", () => {
		const content = toKnowledgeContentJson({
			blocks: [
				{
					content: [{ text: "Ask Prism", type: "text" }],
					props: { level: ExtractionHeadingLevel.NESTED },
					type: "heading",
				},
			],
			fallbackText: FALLBACK_TEXT,
			title: PAGE_TITLE,
		});

		const heading = content[ONLY_BLOCK_INDEX];

		assert.ok(heading);
		assert.equal(heading["type"], "heading");
		assert.deepEqual(heading["props"], {
			level: ExtractionHeadingLevel.NESTED,
		});
	});

	void it("falls back to a plain paragraph when the item has no blocks", () => {
		const content = toKnowledgeContentJson({
			blocks: [],
			fallbackText: FALLBACK_TEXT,
			title: PAGE_TITLE,
		});

		assert.deepEqual(content, [{ content: FALLBACK_TEXT, type: "paragraph" }]);
	});
});
