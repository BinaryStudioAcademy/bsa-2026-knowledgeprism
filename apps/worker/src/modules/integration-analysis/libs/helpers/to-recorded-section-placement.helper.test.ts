import { IntegrationChangeType } from "@knowledgeprism/constants";
import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { type IntegrationAnalysisResult } from "../types/integration-analysis-result.type.js";
import { toClassificationPrompt } from "./to-classification-prompt.helper.js";
import { toRecordedSectionPlacement } from "./to-recorded-section-placement.helper.js";

const FIRST_ITEM_ID = 11;
const SECOND_ITEM_ID = 12;
const TREE_PARENT_ID = 4;
const SIBLING_ORDER_FIRST = 0;
const SIBLING_ORDER_NEXT = 1;
const TREE_INDEX = 0;

const TREE = [
	{
		id: TREE_PARENT_ID,
		parentId: null,
		position: 0,
		title: "Release handbook",
		type: "PAGE",
	},
];

const rootResult = (): IntegrationAnalysisResult<{ id: number }> => {
	return {
		explanation: "Nothing like this is in the knowledge base.",
		matchedItem: null,
		matches: [],
		parentIndex: null,
		parentPriorIndex: null,
		proposesParent: true,
		score: null,
		siblingOrder: SIBLING_ORDER_FIRST,
		type: IntegrationChangeType.NEW,
	};
};

void describe("toRecordedSectionPlacement", () => {
	void it("passes one section's parent and order to the next section", () => {
		const first = toRecordedSectionPlacement({
			extractionItemId: FIRST_ITEM_ID,
			priorPlacements: [],
			result: rootResult(),
			title: "Ask Prism view",
			tree: TREE,
		});
		const second = toRecordedSectionPlacement({
			extractionItemId: SECOND_ITEM_ID,
			priorPlacements: [first.recorded],
			result: {
				...rootResult(),
				parentPriorIndex: TREE_INDEX,
				siblingOrder: SIBLING_ORDER_NEXT,
			},
			title: "Glossary view",
			tree: TREE,
		});
		const prompt = toClassificationPrompt({
			candidateTexts: [],
			itemText: "Glossary view",
			priorPlacements: [first.recorded],
			tree: TREE,
		});

		assert.equal(first.proposesParent, true);
		assert.equal(first.parentId, null);
		assert.equal(first.recorded.siblingOrder, SIBLING_ORDER_FIRST);
		assert.equal(second.parentExtractionItemId, FIRST_ITEM_ID);
		assert.equal(second.parentTitle, "Ask Prism view");
		assert.equal(second.siblingOrder, SIBLING_ORDER_NEXT);
		assert.equal(
			prompt.includes("0 | NEW | parent=root | order=0 | Ask Prism view"),
			true,
		);
		assert.equal(prompt.includes("<prior>"), true);
		assert.equal("blocks" in first.recorded, false);
	});

	void it("uses an existing tree node as the parent", () => {
		const placed = toRecordedSectionPlacement({
			extractionItemId: FIRST_ITEM_ID,
			priorPlacements: [],
			result: {
				...rootResult(),
				parentIndex: TREE_INDEX,
			},
			title: "Core capabilities",
			tree: TREE,
		});

		assert.equal(placed.parentId, TREE_PARENT_ID);
		assert.equal(placed.parentTitle, "Release handbook");
		assert.equal(placed.recorded.parentTreeIndex, TREE_INDEX);
	});
});
