import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { mapOutlineOutput } from "./map-outline-output.helper.js";

const FIRST = 0;
const SECOND = 1;
const THIRD = 2;
const SECTION_COUNT = 3;
const TREE_SIZE = 2;
const LAST_TREE_INDEX = 1;
const SIZES = { sectionCount: SECTION_COUNT, treeSize: TREE_SIZE };

type Parents = {
	parentIndex?: null | number;
	parentPriorIndex?: null | number;
};

type Placement = Parents & { index: number; siblingOrder: number };

const placement = (index: number, parents: Parents = {}): Placement => ({
	index,
	parentIndex: null,
	parentPriorIndex: null,
	siblingOrder: FIRST,
	...parents,
});

const outline = (parents: Parents) => ({
	parentIndex: null,
	parentPriorIndex: null,
	proposesParent: true,
	siblingOrder: FIRST,
	...parents,
});

const mapPlacements = (placements: Placement[]) =>
	mapOutlineOutput({ placements }, SIZES);

void describe("mapOutlineOutput", () => {
	void it("reads a parent from the tree or from an earlier section", () => {
		const raw = JSON.stringify({
			placements: [
				placement(FIRST),
				placement(SECOND, { parentIndex: LAST_TREE_INDEX }),
				placement(THIRD, { parentPriorIndex: FIRST }),
			],
		});

		assert.deepEqual(mapOutlineOutput(raw, SIZES), [
			outline({}),
			outline({ parentIndex: LAST_TREE_INDEX }),
			outline({ parentPriorIndex: FIRST }),
		]);
	});

	void it("rejects an outline that skips a section", () => {
		assert.equal(mapPlacements([placement(FIRST), placement(SECOND)]), null);
	});

	void it("rejects a section placed under itself or a later section", () => {
		assert.equal(
			mapPlacements([
				placement(FIRST),
				placement(SECOND, { parentPriorIndex: SECOND }),
				placement(THIRD),
			]),
			null,
		);
	});

	void it("rejects a parent in both the tree and the document", () => {
		assert.equal(
			mapPlacements([
				placement(FIRST),
				placement(SECOND, { parentIndex: FIRST, parentPriorIndex: FIRST }),
				placement(THIRD),
			]),
			null,
		);
	});

	void it("rejects a tree index outside the tree", () => {
		assert.equal(
			mapPlacements([
				placement(FIRST, { parentIndex: TREE_SIZE }),
				placement(SECOND),
				placement(THIRD),
			]),
			null,
		);
	});
});
