import {
	IntegrationChangeType,
	KnowledgeNodeType,
} from "@knowledgeprism/constants";
import { type IntegrationChangeResponseDto } from "@knowledgeprism/types";
import { describe, expect, it } from "vitest";

import { mapIntegrationChangesToProposedStructure } from "./map-integration-changes-to-proposed-structure.helper.js";
import { mergePlacementIntoPages } from "./merge-placement-into-pages.helper.js";
import {
	rejectActiveSection,
	removePageGroup,
} from "./proposed-structure.helper.js";
import { toPublishedPlacements } from "./to-published-placements.helper.js";

const PARENT_ITEM_ID = 10;
const CHILD_ITEM_ID = 11;
const GRANDCHILD_ITEM_ID = 12;
const CHANGE_ID_OFFSET = 100;
const EXISTING_PAGE_ID = 50;
const FIRST_INDEX = 0;
const SECOND_INDEX = 1;
const GRANDCHILD_INDEX = 2;

const toChange = (
	extractionItemId: number,
	parentExtractionItemId: null | number,
): IntegrationChangeResponseDto => ({
	explanation: "Keep the source hierarchy.",
	extractionItemId,
	id: extractionItemId + CHANGE_ID_OFFSET,
	incomingContent: "Source content",
	incomingTitle: `Item ${String(extractionItemId)}`,
	liveContent: null,
	liveTitle: null,
	matchedNodeId: null,
	mergedBlocks: null,
	placement: {
		matches: [],
		parentExtractionItemId,
		parentId: null,
		parentTitle:
			parentExtractionItemId === null
				? null
				: `Item ${String(parentExtractionItemId)}`,
		proposesParent: true,
		siblingOrder: null,
	},
	score: null,
	type: IntegrationChangeType.NEW,
});

describe("integration nesting", () => {
	it("retains the child and grandchild when their root parent is rejected", () => {
		const pages = mapIntegrationChangesToProposedStructure({
			items: [
				toChange(PARENT_ITEM_ID, null),
				toChange(CHILD_ITEM_ID, PARENT_ITEM_ID),
				toChange(GRANDCHILD_ITEM_ID, CHILD_ITEM_ID),
			],
		});
		const { nextPages } = rejectActiveSection({
			activePageIndex: FIRST_INDEX,
			activeSectionIndex: FIRST_INDEX,
			pages,
		});

		expect(toPublishedPlacements(nextPages, new Set())).toEqual([
			{
				changeId: CHILD_ITEM_ID + CHANGE_ID_OFFSET,
				parentExtractionItemId: null,
				parentId: null,
				position: FIRST_INDEX,
			},
			{
				changeId: GRANDCHILD_ITEM_ID + CHANGE_ID_OFFSET,
				parentExtractionItemId: CHILD_ITEM_ID,
				parentId: null,
				position: SECOND_INDEX,
			},
		]);
		expect(
			nextPages.at(FIRST_INDEX)?.pages.at(FIRST_INDEX)?.proposedPlace,
		).toBe("New root");
	});

	it("moves a retained grandchild to its nearest retained ancestor", () => {
		const pages = mapIntegrationChangesToProposedStructure({
			items: [
				toChange(PARENT_ITEM_ID, null),
				toChange(CHILD_ITEM_ID, PARENT_ITEM_ID),
				toChange(GRANDCHILD_ITEM_ID, CHILD_ITEM_ID),
			],
		});
		const { nextPages } = rejectActiveSection({
			activePageIndex: FIRST_INDEX,
			activeSectionIndex: SECOND_INDEX,
			pages,
		});

		expect(toPublishedPlacements(nextPages, new Set())).toEqual([
			{
				changeId: PARENT_ITEM_ID + CHANGE_ID_OFFSET,
				parentExtractionItemId: null,
				parentId: null,
				position: FIRST_INDEX,
			},
			{
				changeId: GRANDCHILD_ITEM_ID + CHANGE_ID_OFFSET,
				parentExtractionItemId: PARENT_ITEM_ID,
				parentId: null,
				position: SECOND_INDEX,
			},
		]);
		expect(
			nextPages.at(FIRST_INDEX)?.pages.at(SECOND_INDEX)?.proposedPlace,
		).toBe(`Under Item ${String(PARENT_ITEM_ID)}`);
	});

	it("inherits an existing page when its incoming child parent is rejected", () => {
		const parent = toChange(PARENT_ITEM_ID, null);
		parent.placement.parentId = EXISTING_PAGE_ID;
		parent.placement.parentTitle = "Existing document";
		const pages = mapIntegrationChangesToProposedStructure({
			items: [parent, toChange(CHILD_ITEM_ID, PARENT_ITEM_ID)],
		});
		const { nextPages } = rejectActiveSection({
			activePageIndex: FIRST_INDEX,
			activeSectionIndex: FIRST_INDEX,
			pages,
		});

		expect(
			toPublishedPlacements(nextPages, new Set([EXISTING_PAGE_ID])),
		).toEqual([
			{
				changeId: CHILD_ITEM_ID + CHANGE_ID_OFFSET,
				parentExtractionItemId: null,
				parentId: EXISTING_PAGE_ID,
				position: FIRST_INDEX,
			},
		]);
		expect(
			nextPages.at(FIRST_INDEX)?.pages.at(FIRST_INDEX)?.proposedPlace,
		).toBe("Under Existing document");
	});

	it("keeps children publishable when a rejected group contains consecutive ancestors", () => {
		const [group] = mapIntegrationChangesToProposedStructure({
			items: [
				toChange(PARENT_ITEM_ID, null),
				toChange(CHILD_ITEM_ID, PARENT_ITEM_ID),
				toChange(GRANDCHILD_ITEM_ID, CHILD_ITEM_ID),
			],
		});
		if (!group) {
			throw new Error("Missing fixture group");
		}
		const pages = [
			{
				...group,
				pages: group.pages.slice(FIRST_INDEX, GRANDCHILD_INDEX),
			},
			{
				...group,
				id: "retained",
				pages: group.pages.slice(GRANDCHILD_INDEX),
			},
		];

		expect(
			toPublishedPlacements(removePageGroup(pages, FIRST_INDEX), new Set()),
		).toEqual([
			{
				changeId: GRANDCHILD_ITEM_ID + CHANGE_ID_OFFSET,
				parentExtractionItemId: null,
				parentId: null,
				position: FIRST_INDEX,
			},
		]);
	});

	it("carries three levels from analysis through the review into the publish payload", () => {
		const placement = mapIntegrationChangesToProposedStructure({
			items: [
				toChange(GRANDCHILD_ITEM_ID, CHILD_ITEM_ID),
				toChange(CHILD_ITEM_ID, PARENT_ITEM_ID),
				toChange(PARENT_ITEM_ID, null),
			],
		});
		const proposal = placement.map((group) => ({
			...group,
			pages: group.pages.map((page) => ({
				content: page.content,
				id: page.id,
				integrationChangeId: Number(page.id),
				status: "created" as const,
				title: page.title,
				type: KnowledgeNodeType.ENTRY,
			})),
		}));

		expect(
			toPublishedPlacements(
				mergePlacementIntoPages(proposal, placement),
				new Set(),
			),
		).toEqual([
			{
				changeId: GRANDCHILD_ITEM_ID + CHANGE_ID_OFFSET,
				parentExtractionItemId: CHILD_ITEM_ID,
				parentId: null,
				position: 0,
			},
			{
				changeId: CHILD_ITEM_ID + CHANGE_ID_OFFSET,
				parentExtractionItemId: PARENT_ITEM_ID,
				parentId: null,
				position: 1,
			},
			{
				changeId: PARENT_ITEM_ID + CHANGE_ID_OFFSET,
				parentExtractionItemId: null,
				parentId: null,
				position: 2,
			},
		]);
	});
});
