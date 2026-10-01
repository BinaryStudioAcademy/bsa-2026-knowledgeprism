import { KnowledgeNodeType } from "@knowledgeprism/constants";
import { describe, expect, it } from "vitest";

import { type ProposedSection } from "../types/types.js";
import { toPublishedItems } from "./to-published-items.helper.js";

const ITEM_ID = 12;

const toSections = (
	page: Partial<ProposedSection["pages"][number]>,
): ProposedSection[] => [
	{
		id: "section",
		pages: [
			{
				content: "Introduction\n\nKnowledgePrism keeps project knowledge.",
				id: String(ITEM_ID),
				integrationChangeId: ITEM_ID,
				status: "created",
				title: "Introduction",
				type: KnowledgeNodeType.PAGE,
				...page,
			},
		],
		status: "created",
		title: "Section",
		type: KnowledgeNodeType.SECTION,
	},
];

describe("toPublishedItems", () => {
	it("publishes the reviewed blocks with their structure", () => {
		const [item] = toPublishedItems(
			toSections({
				blocks: [
					{
						content: [{ styles: {}, text: "Introduction", type: "text" }],
						props: { level: 2 },
						type: "heading",
					},
					{
						content: [
							{ styles: { bold: true }, text: "Prism", type: "text" },
							{ styles: {}, text: " keeps knowledge.", type: "text" },
						],
						type: "bulletListItem",
					},
				],
			}),
		);

		expect(item?.blocks?.map((block) => block.type)).toEqual([
			"heading",
			"bulletListItem",
		]);
		const [, listBlock] = item?.blocks ?? [];
		const [leadRun] = listBlock?.content ?? [];

		expect(leadRun?.styles).toEqual({ bold: true });
	});

	it("splits plain content into paragraphs without repeating the title", () => {
		const [item] = toPublishedItems(toSections({}));

		expect(item?.blocks).toEqual([
			{
				content: [
					{ text: "KnowledgePrism keeps project knowledge.", type: "text" },
				],
				type: "paragraph",
			},
		]);
	});

	it("skips pages that were never saved as extraction items", () => {
		expect(toPublishedItems(toSections({ id: "manual-page" }))).toEqual([]);
	});
});
