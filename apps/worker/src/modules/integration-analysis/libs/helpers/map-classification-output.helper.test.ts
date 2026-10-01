import { IntegrationChangeType } from "@knowledgeprism/constants";
import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { mapClassificationOutput } from "./map-classification-output.helper.js";

const CANDIDATE = {
	content: "The old limit is 10 requests.",
	id: 4,
	title: "Rate limit",
};

const PARENT_PRIOR_INDEX = 0;
const SIBLING_ORDER = 1;
const MATCHES = [{ item: CANDIDATE, score: 0.8 }];

void describe("mapClassificationOutput", () => {
	void it("keeps the existing classification when placement keys are absent", () => {
		const result = mapClassificationOutput(
			{
				explanation: "The item revises the limit.",
				matchedIndex: 0,
				type: IntegrationChangeType.UPDATE,
			},
			MATCHES,
		);

		assert.ok(result);
		assert.equal(result.type, IntegrationChangeType.UPDATE);
		assert.equal(result.matchedItem, CANDIDATE);
		assert.equal(result.proposesParent, false);
		assert.deepEqual(result.matches, []);
	});

	void it("records a new root and a wording span without changing the match", () => {
		const result = mapClassificationOutput(
			{
				explanation: "The same limit is worded differently.",
				matchedIndex: 0,
				matches: [{ index: 0, span: "old limit" }],
				parentIndex: null,
				type: IntegrationChangeType.CONFLICT,
			},
			MATCHES,
		);

		assert.ok(result);
		assert.equal(result.type, IntegrationChangeType.CONFLICT);
		assert.equal(result.proposesParent, true);
		assert.equal(result.parentIndex, null);
		assert.deepEqual(result.matches, [{ item: CANDIDATE, span: "old limit" }]);
	});

	void it("records an earlier section as the parent and a sibling order", () => {
		const result = mapClassificationOutput(
			{
				explanation: "This section follows the one already placed.",
				matchedIndex: null,
				parentPriorIndex: PARENT_PRIOR_INDEX,
				siblingOrder: SIBLING_ORDER,
				type: IntegrationChangeType.NEW,
			},
			MATCHES,
		);

		assert.ok(result);
		assert.equal(result.type, IntegrationChangeType.NEW);
		assert.equal(result.proposesParent, true);
		assert.equal(result.parentIndex, null);
		assert.equal(result.parentPriorIndex, PARENT_PRIOR_INDEX);
		assert.equal(result.siblingOrder, SIBLING_ORDER);
	});

	void it("parses a classification wrapped in a markdown fence", () => {
		const fenced = [
			"```json",
			JSON.stringify({
				explanation: "This section is new and follows the earlier section.",
				matchedIndex: null,
				matches: [],
				parentIndex: null,
				parentPriorIndex: PARENT_PRIOR_INDEX,
				siblingOrder: SIBLING_ORDER,
				type: IntegrationChangeType.NEW,
			}),
			"```",
		].join("\n");
		const result = mapClassificationOutput(fenced, []);

		assert.ok(result);
		assert.equal(result.type, IntegrationChangeType.NEW);
		assert.equal(result.matchedItem, null);
		assert.equal(result.parentPriorIndex, PARENT_PRIOR_INDEX);
		assert.equal(result.siblingOrder, SIBLING_ORDER);
		assert.equal(result.proposesParent, true);
	});

	void it("drops a span that is not in the candidate text", () => {
		const result = mapClassificationOutput(
			{
				explanation: "The item revises the limit.",
				matchedIndex: 0,
				matches: [{ index: 0, span: "not in the candidate" }],
				type: IntegrationChangeType.UPDATE,
			},
			MATCHES,
		);

		assert.ok(result);
		assert.deepEqual(result.matches, []);
	});
});
