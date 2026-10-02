import {
	ExtractionItemStatus,
	KnowledgeNodeType,
} from "@knowledgeprism/constants";
import {
	ExtractionHeadingLevel,
	type ExtractionItemResponseDto,
} from "@knowledgeprism/types";
import { describe, expect, it } from "vitest";

import { type ProposedSection } from "../types/types.js";
import {
	mapExtractionItemsToProposedStructure,
	toExtractionReviewPayload,
} from "./extraction-review.helper.js";

const ITEM_ID = 12;
const CONFIDENCE = 0.9;
const PAGE_NUMBER = 1;
const POSITION = 0;
const FIRST_SECTION_INDEX = 0;
const FIRST_ITEM_INDEX = 0;
const SECOND_ITEM_ID = 13;
const SECOND_PAGE_NUMBER = 7;
const SINGLE_SECTION_COUNT = 1;
const UNGROUPED_ITEMS_TITLE = "Ungrouped items";

const extractionItem = (): ExtractionItemResponseDto => ({
	confidence: CONFIDENCE,
	extractionSectionId: null,
	heading: "Core Capabilities",
	id: ITEM_ID,
	position: POSITION,
	rationale: "Extracted from the source",
	sourceExcerpt: "Core Capabilities",
	sourcePageNumber: PAGE_NUMBER,
	status: ExtractionItemStatus.PENDING,
	text: "Core Capabilities\n\nStores approved knowledge",
	title: "Core Capabilities",
});

const pages = (): ProposedSection[] => [
	{
		id: "section-1",
		pages: [
			{
				blocks: [
					{
						content: [{ styles: {}, text: "Core Capabilities", type: "text" }],
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
							{ styles: { italic: true }, text: ": keep it", type: "text" },
						],
						props: { backgroundColor: "blue" },
						type: "paragraph",
					},
					{
						content: [
							{
								styles: {},
								text: "Stores approved knowledge",
								type: "text",
							},
						],
						props: { checked: false },
						type: "checkListItem",
					},
				],
				content: "Core Capabilities\n\nDecision: keep it",
				id: String(ITEM_ID),
				integrationChangeId: ITEM_ID,
				status: "created",
				title: "Core Capabilities",
				type: KnowledgeNodeType.PAGE,
			},
		],
		status: "created",
		title: "Core Capabilities",
		type: KnowledgeNodeType.SECTION,
	},
];

describe("toExtractionReviewPayload", () => {
	it("sends headings, callouts, and checklists with the approval", () => {
		const payload = toExtractionReviewPayload(pages(), [extractionItem()]);
		const section = payload.sections?.[FIRST_SECTION_INDEX];
		const item = section?.items[FIRST_ITEM_INDEX];
		const blocks = item?.blocks;

		expect(blocks).toEqual([
			{
				content: [{ text: "Core Capabilities", type: "text" }],
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
					{ text: ": keep it", type: "text" },
				],
				props: { backgroundColor: "blue" },
				type: "paragraph",
			},
			{
				content: [{ text: "Stores approved knowledge", type: "text" }],
				props: { checked: false },
				type: "checkListItem",
			},
		]);
	});
});

describe("mapExtractionItemsToProposedStructure", () => {
	it("groups unsectioned items from different pages into one ungrouped section", () => {
		const structure = mapExtractionItemsToProposedStructure([
			extractionItem(),
			{
				...extractionItem(),
				id: SECOND_ITEM_ID,
				sourcePageNumber: SECOND_PAGE_NUMBER,
			},
		]);

		expect(structure).toHaveLength(SINGLE_SECTION_COUNT);
		expect(structure[FIRST_SECTION_INDEX]).toMatchObject({
			title: UNGROUPED_ITEMS_TITLE,
			type: KnowledgeNodeType.SECTION,
		});
		expect(
			structure[FIRST_SECTION_INDEX]?.pages.map((page) => page.id),
		).toEqual([String(ITEM_ID), String(SECOND_ITEM_ID)]);
	});
});
