import { describe, expect, it } from "vitest";

import { parseInitialContent } from "./parse-initial-content.helper.js";

const PAGE_TITLE = "Core Capabilities";
const SECTION_HEADING_LEVEL = 2;

describe("parseInitialContent", () => {
	it("drops a heading that repeats the page title and keeps the list", () => {
		const content = parseInitialContent(
			[
				{
					content: [{ styles: {}, text: PAGE_TITLE, type: "text" }],
					props: { level: SECTION_HEADING_LEVEL },
					type: "heading",
				},
				{
					content: [
						{
							styles: { bold: true },
							text: "Unified Knowledge Base",
							type: "text",
						},
						{ styles: {}, text: " Creates a knowledge base.", type: "text" },
					],
					type: "numberedListItem",
				},
			],
			PAGE_TITLE,
		);

		expect(content).toEqual([
			{
				content: [
					{
						styles: { bold: true },
						text: "Unified Knowledge Base",
						type: "text",
					},
					{ styles: {}, text: " Creates a knowledge base.", type: "text" },
				],
				type: "numberedListItem",
			},
		]);
	});
});
