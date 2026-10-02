import { type ExtractionContentBlock } from "@knowledgeprism/types";
import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { toExtractionBlocks } from "./to-extraction-blocks.helper.js";
import { toKnowledgeContentJson } from "./to-knowledge-content-json.helper.js";

const BLOCKS: ExtractionContentBlock[] = [
	{
		content: [{ text: "Roles", type: "text" }],
		props: { level: 3 },
		type: "heading",
	},
	{
		content: [
			{ styles: { bold: true }, text: "Admin", type: "text" },
			{ text: " manages users.", type: "text" },
		],
		type: "bulletListItem",
	},
	{
		content: [{ text: "Invite sent", type: "text" }],
		props: { checked: true },
		type: "checkListItem",
	},
	{
		content: [{ text: "Decision: keep sessions short.", type: "text" }],
		props: { backgroundColor: "blue" },
		type: "paragraph",
	},
];

const toEditorParagraph = (
	styles: Record<string, unknown>,
	extra: Record<string, unknown> = {},
): Record<string, unknown> => ({
	children: [],
	content: [{ styles, text: "Sessions expire.", type: "text" }],
	props: {
		backgroundColor: "default",
		textAlignment: "left",
		textColor: "default",
	},
	type: "paragraph",
	...extra,
});

void describe("toExtractionBlocks", () => {
	void it("reads back blocks stored from an extraction", () => {
		assert.deepEqual(
			toExtractionBlocks(
				toKnowledgeContentJson({ blocks: BLOCKS, fallbackText: "", title: "" }),
			),
			BLOCKS,
		);
	});

	void it("reads editor blocks with default colors and plain text nodes", () => {
		assert.deepEqual(
			toExtractionBlocks([
				toEditorParagraph({}),
				{ content: "Old node text.", type: "paragraph" },
			]),
			[
				{
					content: [{ text: "Sessions expire.", type: "text" }],
					type: "paragraph",
				},
				{
					content: [{ text: "Old node text.", type: "text" }],
					type: "paragraph",
				},
			],
		);
	});

	void it("refuses content the merge would lose", () => {
		assert.equal(
			toExtractionBlocks([toEditorParagraph({ italic: true })]),
			null,
		);
		const child = toEditorParagraph({});

		assert.equal(
			toExtractionBlocks([toEditorParagraph({}, { children: [child] })]),
			null,
		);
		assert.equal(
			toExtractionBlocks([{ content: { rows: [] }, type: "table" }]),
			null,
		);
	});
});
