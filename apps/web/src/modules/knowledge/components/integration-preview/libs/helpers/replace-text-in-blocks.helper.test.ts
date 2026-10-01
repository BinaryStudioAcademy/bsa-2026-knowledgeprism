import { type PartialBlock } from "@blocknote/core";
import { describe, expect, it } from "vitest";

import { replaceTextInBlocks } from "./replace-text-in-blocks.helper.js";

const replacement = { from: "Postgres", to: "PostgreSQL" };

describe("replaceTextInBlocks", () => {
	it("replaces the first match inside a styled run and keeps its formatting", () => {
		const blocks: PartialBlock[] = [
			{
				content: [{ styles: { bold: true }, text: "Storage", type: "text" }],
				props: { level: 2 },
				type: "heading",
			},
			{
				content: [
					{ styles: { bold: true }, text: "Database", type: "text" },
					{
						styles: {},
						text: " Use Postgres. Postgres is fine.",
						type: "text",
					},
				],
				type: "bulletListItem",
			},
		];

		const [headingBlock] = blocks;

		expect(replaceTextInBlocks(blocks, replacement)).toEqual([
			headingBlock,
			{
				content: [
					{ styles: { bold: true }, text: "Database", type: "text" },
					{
						styles: {},
						text: " Use PostgreSQL. Postgres is fine.",
						type: "text",
					},
				],
				type: "bulletListItem",
			},
		]);
	});

	it("replaces inside string content and nested children", () => {
		const blocks: PartialBlock[] = [
			{
				children: [{ content: "Keep Postgres.", type: "paragraph" }],
				content: "Parent",
				type: "paragraph",
			},
		];

		expect(replaceTextInBlocks(blocks, replacement)).toEqual([
			{
				children: [{ content: "Keep PostgreSQL.", type: "paragraph" }],
				content: "Parent",
				type: "paragraph",
			},
		]);
	});

	it("returns null when the text is not inside a single run", () => {
		const blocks: PartialBlock[] = [
			{
				content: [
					{ styles: {}, text: "Post", type: "text" },
					{ styles: { bold: true }, text: "gres", type: "text" },
				],
				type: "paragraph",
			},
		];

		expect(replaceTextInBlocks(blocks, replacement)).toBeNull();
	});
});
