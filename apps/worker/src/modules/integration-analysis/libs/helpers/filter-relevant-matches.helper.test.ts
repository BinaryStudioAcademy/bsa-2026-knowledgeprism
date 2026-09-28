import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { filterRelevantMatches } from "./filter-relevant-matches.helper.js";

// Cohere embed-multilingual-v3 scores measured with both texts embedded as search_document.
const MeasuredScore = {
	CHANGED_VALUE: 0.914,
	CONTRADICTION: 0.764,
	EXACT_DUPLICATE: 1,
	OTHER_FACT_IN_SAME_DOCUMENT: 0.537,
	REWORDED_CHANGED_VALUE: 0.802,
	REWORDED_CONTRADICTION: 0.641,
	SAME_TOPIC_DIFFERENT_FACT: 0.597,
	UNRELATED: 0.442,
} as const;

const toMatch = (
	label: string,
	score: number,
): { item: string; score: number } => ({ item: label, score });

void describe("filterRelevantMatches", () => {
	void it("keeps changed, reworded, contradicting and duplicate facts for classification", () => {
		const matches = [
			toMatch("exact duplicate", MeasuredScore.EXACT_DUPLICATE),
			toMatch("changed value", MeasuredScore.CHANGED_VALUE),
			toMatch("reworded changed value", MeasuredScore.REWORDED_CHANGED_VALUE),
			toMatch("contradiction", MeasuredScore.CONTRADICTION),
			toMatch("reworded contradiction", MeasuredScore.REWORDED_CONTRADICTION),
		];

		assert.deepEqual(filterRelevantMatches(matches), matches);
	});

	void it("drops different facts on the same topic and unrelated facts", () => {
		const matches = [
			toMatch("same topic", MeasuredScore.SAME_TOPIC_DIFFERENT_FACT),
			toMatch("other fact", MeasuredScore.OTHER_FACT_IN_SAME_DOCUMENT),
			toMatch("unrelated", MeasuredScore.UNRELATED),
		];

		assert.deepEqual(filterRelevantMatches(matches), []);
	});

	void it("keeps the order of the matches it keeps", () => {
		const matches = [
			toMatch("changed value", MeasuredScore.CHANGED_VALUE),
			toMatch("unrelated", MeasuredScore.UNRELATED),
			toMatch("contradiction", MeasuredScore.CONTRADICTION),
		];

		assert.deepEqual(
			filterRelevantMatches(matches).map(({ item }) => item),
			["changed value", "contradiction"],
		);
	});
});
