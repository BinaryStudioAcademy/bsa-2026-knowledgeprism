import { KnowledgeNodeType } from "@knowledgeprism/constants";
import { describe, expect, it } from "vitest";

import { type ProposedPage, type ProposedSection } from "../types/types.js";
import { toPublishedPlacements } from "./to-published-placements.helper.js";

const EXISTING_PAGE_ID = 40;
const UNKNOWN_NODE_ID = 99;
const FIRST_CHANGE_ID = 1;
const SECOND_CHANGE_ID = 2;
const THIRD_CHANGE_ID = 3;

const toPage = (
	integrationChangeId: number,
	placementParentId: null | number,
): ProposedPage => ({
	content: "Content",
	id: String(integrationChangeId),
	integrationChangeId,
	placementParentId,
	status: "created",
	title: `Item ${String(integrationChangeId)}`,
	type: KnowledgeNodeType.PAGE,
});

const toGroup = (pages: ProposedPage[]): ProposedSection => ({
	id: "group",
	pages,
	status: "created",
	title: "Group",
	type: KnowledgeNodeType.SECTION,
});

describe("toPublishedPlacements", () => {
	it("sends each section's chosen page and its order across groups", () => {
		const groups = [
			toGroup([toPage(SECOND_CHANGE_ID, EXISTING_PAGE_ID)]),
			toGroup([
				toPage(FIRST_CHANGE_ID, null),
				toPage(THIRD_CHANGE_ID, EXISTING_PAGE_ID),
			]),
		];

		expect(toPublishedPlacements(groups, new Set([EXISTING_PAGE_ID]))).toEqual([
			{ changeId: SECOND_CHANGE_ID, parentId: EXISTING_PAGE_ID, position: 0 },
			{ changeId: FIRST_CHANGE_ID, parentId: null, position: 1 },
			{ changeId: THIRD_CHANGE_ID, parentId: EXISTING_PAGE_ID, position: 2 },
		]);
	});

	it("falls back to the document's page when the chosen parent is not a page", () => {
		const groups = [toGroup([toPage(FIRST_CHANGE_ID, UNKNOWN_NODE_ID)])];

		expect(toPublishedPlacements(groups, new Set([EXISTING_PAGE_ID]))).toEqual([
			{ changeId: FIRST_CHANGE_ID, parentId: null, position: 0 },
		]);
	});
});
