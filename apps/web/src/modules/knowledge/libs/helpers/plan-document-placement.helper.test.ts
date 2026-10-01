import { KnowledgeNodeType } from "@knowledgeprism/constants";
import { type KnowledgeTreeItemResponseDto } from "@knowledgeprism/types";
import { describe, expect, it } from "vitest";

import {
	canAddSubdocument,
	DropZone,
	planDrop,
	planMoveToParent,
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
	it("reorders a document after its next sibling", () => {
		expect(
			planDrop(tree, GUIDE_ID, { targetId: NOTES_ID, zone: DropZone.AFTER }),
		).toEqual({ parentId: ROOT_PARENT_ID, position: POSITION_SECOND });
	});

	it("places a document before a sibling", () => {
		expect(
			planDrop(tree, NOTES_ID, { targetId: GUIDE_ID, zone: DropZone.BEFORE }),
		).toEqual({ parentId: ROOT_PARENT_ID, position: POSITION_FIRST });
	});

	it("ignores a drop that leaves the document where it is", () => {
		expect(
			planDrop(tree, GUIDE_ID, { targetId: NOTES_ID, zone: DropZone.BEFORE }),
		).toBeNull();
	});

	it("nests a document at the end of the target", () => {
		expect(
			planDrop(tree, NOTES_ID, { targetId: GUIDE_ID, zone: DropZone.INSIDE }),
		).toEqual({ parentId: GUIDE_ID, position: POSITION_SECOND });
	});

	it("moves a nested document beside a root document", () => {
		expect(
			planDrop(tree, NESTED_ID, { targetId: GUIDE_ID, zone: DropZone.AFTER }),
		).toEqual({ parentId: ROOT_PARENT_ID, position: POSITION_SECOND });
		expect(planMoveToParent(tree, NESTED_ID, ROOT_PARENT_ID)).toEqual({
			parentId: ROOT_PARENT_ID,
			position: POSITION_THIRD,
		});
	});

	it("rejects dropping a document into its own subtree or onto itself", () => {
		expect(
			planDrop(tree, NOTES_ID, { targetId: NESTED_ID, zone: DropZone.INSIDE }),
		).toBeNull();
		expect(
			planDrop(tree, NOTES_ID, { targetId: NESTED_ID, zone: DropZone.AFTER }),
		).toBeNull();
		expect(
			planDrop(tree, NOTES_ID, { targetId: NOTES_ID, zone: DropZone.AFTER }),
		).toBeNull();
	});

	it("does not move or drop onto a fact entry", () => {
		expect(
			planDrop(tree, FACT_ID, { targetId: NOTES_ID, zone: DropZone.AFTER }),
		).toBeNull();
		expect(
			planDrop(tree, NOTES_ID, { targetId: FACT_ID, zone: DropZone.INSIDE }),
		).toBeNull();
		expect(
			planDrop(tree, NOTES_ID, { targetId: FACT_ID, zone: DropZone.BEFORE }),
		).toBeNull();
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
		expect(
			planDrop(deepTree, ROOT_ID, {
				targetId: DETAILS_ID,
				zone: DropZone.INSIDE,
			}),
		).toBeNull();
		expect(canAddSubdocument(deepTree, NOTES_ID)).toBe(true);
	});
});
