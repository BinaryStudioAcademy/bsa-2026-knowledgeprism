import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { type GlossaryConsistencyTerm } from "../types/types.js";
import { filterRelevantTerms } from "./filter-relevant-terms.helper.js";
import { mapConsistencyOutput } from "./map-consistency-output.helper.js";

const API_TERM: GlossaryConsistencyTerm = {
	definition: "Application programming interface.",
	embedding: [],
	id: 1,
	name: "API",
};
const SLA_TERM: GlossaryConsistencyTerm = {
	definition: "Service level agreement.",
	embedding: [],
	id: 2,
	name: "SLA",
};

// Measured with cohere.embed-multilingual-v3, both sides embedded as SEARCH_DOCUMENT
// (see glossary-consistency-threshold.constant.ts for the full table).
const MeasuredScore = {
	API_PARAPHRASE: 0.635,
	SLA_EXACT_PHRASE: 0.719,
	UNRELATED_MAX: 0.492,
} as const;

void describe("filterRelevantTerms", () => {
	void it("keeps a paraphrase match above the threshold", () => {
		const matches = [{ item: API_TERM, score: MeasuredScore.API_PARAPHRASE }];

		assert.deepEqual(filterRelevantTerms(matches), matches);
	});

	void it("keeps a near-exact definition match above the threshold", () => {
		const matches = [{ item: SLA_TERM, score: MeasuredScore.SLA_EXACT_PHRASE }];

		assert.deepEqual(filterRelevantTerms(matches), matches);
	});

	void it("drops an unrelated match below the threshold", () => {
		const matches = [{ item: API_TERM, score: MeasuredScore.UNRELATED_MAX }];

		assert.deepEqual(filterRelevantTerms(matches), []);
	});
});

void describe("mapConsistencyOutput", () => {
	const content =
		"Developers can access our web service through the application programming interface.";

	void it("maps a valid Claude response to a match", () => {
		const raw = JSON.stringify([
			{
				explanation: "Refers to the API without using its canonical name.",
				sourceExcerpt: "application programming interface",
				suggestedText: "API",
				termId: 1,
			},
		]);

		const result = mapConsistencyOutput(raw, content, [API_TERM]);

		assert.deepEqual(result, [
			{
				canonicalName: "API",
				explanation: "Refers to the API without using its canonical name.",
				matchedTermId: 1,
				sourceExcerpt: "application programming interface",
				suggestedText: "API",
			},
		]);
	});

	void it("accepts termId as a numeric string, not just a number", () => {
		const raw = JSON.stringify([
			{
				explanation: "Refers to the API without using its canonical name.",
				sourceExcerpt: "application programming interface",
				suggestedText: "API",
				termId: "1",
			},
		]);

		const result = mapConsistencyOutput(raw, content, [API_TERM]);

		assert.deepEqual(result, [
			{
				canonicalName: "API",
				explanation: "Refers to the API without using its canonical name.",
				matchedTermId: 1,
				sourceExcerpt: "application programming interface",
				suggestedText: "API",
			},
		]);
	});

	void it("drops a match whose sourceExcerpt is not actually in the content", () => {
		const raw = JSON.stringify([
			{
				explanation: "Fabricated.",
				sourceExcerpt: "this text does not appear anywhere",
				suggestedText: "API",
				termId: 1,
			},
		]);

		assert.deepEqual(mapConsistencyOutput(raw, content, [API_TERM]), []);
	});

	void it("drops a match against a term that was not a candidate", () => {
		const raw = JSON.stringify([
			{
				explanation: "Refers to a term outside the candidate set.",
				sourceExcerpt: "application programming interface",
				suggestedText: "API",
				termId: 999,
			},
		]);

		assert.deepEqual(mapConsistencyOutput(raw, content, [API_TERM]), []);
	});

	void it("drops a suggestion for text that already uses the canonical name", () => {
		const raw = JSON.stringify([
			{
				explanation: "Backwards suggestion.",
				sourceExcerpt: "call the API",
				suggestedText: "call the application programming interface",
				termId: 1,
			},
		]);

		assert.deepEqual(
			mapConsistencyOutput(raw, "Partners call the API daily.", [API_TERM]),
			[],
		);
	});

	void it("keeps a suggestion when the name only appears in a different case", () => {
		const raw = JSON.stringify([
			{
				explanation: "Lowercase variant of the canonical name.",
				sourceExcerpt: "the api",
				suggestedText: "the API",
				termId: 1,
			},
		]);

		assert.deepEqual(
			mapConsistencyOutput(raw, "Partners call the api daily.", [API_TERM]),
			[
				{
					canonicalName: "API",
					explanation: "Lowercase variant of the canonical name.",
					matchedTermId: 1,
					sourceExcerpt: "the api",
					suggestedText: "the API",
				},
			],
		);
	});

	void it("returns an empty array for an empty response", () => {
		assert.deepEqual(mapConsistencyOutput("[]", content, [API_TERM]), []);
	});

	void it("returns null for a malformed response", () => {
		assert.equal(mapConsistencyOutput("not json", content, [API_TERM]), null);
	});

	void it("recovers the final answer when Claude second-guesses itself inline before it", () => {
		const wrongGuess = JSON.stringify([
			{
				explanation: "wrong first guess",
				sourceExcerpt: "application programming interface",
				suggestedText: "API",
				termId: 1,
			},
		]);
		const raw = `${wrongGuess}\n\nWait, let me reconsider. Actually there is no mismatch here.\n\n[]`;

		assert.deepEqual(mapConsistencyOutput(raw, content, [API_TERM]), []);
	});

	void it("recovers a real match when it is the last array after reconsideration", () => {
		const wrongGuess = JSON.stringify([
			{
				explanation: "wrong first guess",
				sourceExcerpt: "web service",
				suggestedText: "API",
				termId: 1,
			},
		]);
		const correctAnswer = JSON.stringify([
			{
				explanation: "Refers to the API without using its canonical name.",
				sourceExcerpt: "application programming interface",
				suggestedText: "API",
				termId: 1,
			},
		]);
		const raw = `${wrongGuess}\n\nWait, let me reconsider the actual paraphrase.\n\n${correctAnswer}`;

		const result = mapConsistencyOutput(raw, content, [API_TERM]);

		assert.deepEqual(result, [
			{
				canonicalName: "API",
				explanation: "Refers to the API without using its canonical name.",
				matchedTermId: 1,
				sourceExcerpt: "application programming interface",
				suggestedText: "API",
			},
		]);
	});
});
