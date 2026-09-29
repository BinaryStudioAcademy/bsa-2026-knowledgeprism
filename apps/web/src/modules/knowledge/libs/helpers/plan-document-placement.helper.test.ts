import { KnowledgeNodeType } from "@knowledgeprism/constants";
import { type KnowledgeTreeItemResponseDto } from "@knowledgeprism/types";
import { describe, expect, it } from "vitest";

import {
	canAddSubdocument,
	planMoveDown,
	planMoveOut,
	planMoveUp,
	planNestUnderPrevious,
} from "./plan-document-placement.helper.js";

const DETAILS_ID = 3;
const FACT_ID = 3;
const GUIDE_ID = 1;
const NESTED_ID = 4;
const NOTES_ID = 2;
const POSITION_FIRST = 0;
const POSITION_SECOND = 1;
const POSITION_THIRD = 2;
const ROOT_ID = 5;
const ROOT_PARENT_ID = null;
const UPDATED_AT = "2026-09-29T00:00:00.000Z";

const item = ({
	id,
	parentId,
	position,
	type = KnowledgeNodeType.PAGE,
}: {
	id: number;
	parentId: null | number;
	position: number;
	type?: KnowledgeTreeItemResponseDto["type"];
}): KnowledgeTreeItemResponseDto => {
	return {
		id,
		parentId,
		position,
		title: `Node ${String(id)}`,
		type,
		updatedAt: UPDATED_AT,
	};
};

const tree = [
	item({ id: GUIDE_ID, parentId: ROOT_PARENT_ID, position: POSITION_FIRST }),
	item({ id: NOTES_ID, parentId: ROOT_PARENT_ID, position: POSITION_SECOND }),
	item({
		id: FACT_ID,
		parentId: GUIDE_ID,
		position: POSITION_FIRST,
		type: KnowledgeNodeType.ENTRY,
	}),
	item({ id: NESTED_ID, parentId: NOTES_ID, position: POSITION_FIRST }),
];

describe("planDocumentPlacement", () => {
	it("moves a document down among its siblings", () => {
		expect(planMoveDown(tree, GUIDE_ID)).toEqual({
			parentId: ROOT_PARENT_ID,
			position: POSITION_SECOND,
		});
		expect(planMoveUp(tree, GUIDE_ID)).toBeNull();
	});

	it("nests a document under the previous document", () => {
		expect(planNestUnderPrevious(tree, NOTES_ID)).toEqual({
			parentId: GUIDE_ID,
			position: POSITION_SECOND,
		});
	});

	it("moves a nested document out beside its parent", () => {
		expect(planMoveOut(tree, NESTED_ID)).toEqual({
			parentId: ROOT_PARENT_ID,
			position: POSITION_THIRD,
		});
	});

	it("does not move a fact entry", () => {
		expect(planMoveUp(tree, FACT_ID)).toBeNull();
		expect(planMoveDown(tree, FACT_ID)).toBeNull();
		expect(planNestUnderPrevious(tree, FACT_ID)).toBeNull();
	});

	it("stops nesting at three levels", () => {
		const deepTree = [
			item({ id: ROOT_ID, parentId: ROOT_PARENT_ID, position: POSITION_FIRST }),
			item({
				id: GUIDE_ID,
				parentId: ROOT_PARENT_ID,
				position: POSITION_SECOND,
			}),
			item({ id: NOTES_ID, parentId: GUIDE_ID, position: POSITION_FIRST }),
			item({ id: DETAILS_ID, parentId: NOTES_ID, position: POSITION_FIRST }),
		];

		expect(canAddSubdocument(deepTree, DETAILS_ID)).toBe(false);
		expect(planNestUnderPrevious(deepTree, GUIDE_ID)).toBeNull();
		expect(canAddSubdocument(deepTree, NOTES_ID)).toBe(true);
	});
});
