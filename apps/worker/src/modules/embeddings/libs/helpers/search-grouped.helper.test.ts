import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { searchGrouped } from "./search-grouped.helper.js";

const FIRST_INDEX = 0;
const OFF = 0;
const ON = 1;
const PERFECT_SCORE = 1;
const SINGLE_MATCH = 1;
const X_AXIS = [ON, OFF];
const Y_AXIS = [OFF, ON];
const DIAGONAL = [ON, ON];

void describe("searchGrouped", () => {
	void it("scores each item by its best chunk and returns it once", () => {
		const pricing = { id: 1 };
		const releasePlan = { id: 2 };
		const matches = searchGrouped({
			candidates: [
				{ item: pricing, vector: Y_AXIS },
				{ item: pricing, vector: X_AXIS },
				{ item: releasePlan, vector: DIAGONAL },
			],
			queryVectors: [X_AXIS],
		});

		assert.deepEqual(
			matches.map(({ item }) => item),
			[pricing, releasePlan],
		);
		assert.equal(matches[FIRST_INDEX]?.score, PERFECT_SCORE);
	});

	void it("uses the best pair when the query has several chunks", () => {
		const pricing = { id: 1 };
		const matches = searchGrouped({
			candidates: [{ item: pricing, vector: Y_AXIS }],
			queryVectors: [X_AXIS, Y_AXIS],
			topK: SINGLE_MATCH,
		});

		assert.equal(matches.length, SINGLE_MATCH);
		assert.equal(matches[FIRST_INDEX]?.score, PERFECT_SCORE);
	});
});
