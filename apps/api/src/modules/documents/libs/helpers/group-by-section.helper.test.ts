import { ExtractionItemStatus } from "@knowledgeprism/constants";
import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { ExtractionItemEntity } from "~/modules/documents/models/extraction-item.entity.js";

import { groupBySection } from "./group-by-section.helper.js";

const DOCUMENT_ID = 1;
const FIRST_ITEM_ID = 1;
const SECOND_ITEM_ID = 2;
const FIRST_PAGE = 2;
const SECOND_PAGE = 7;
const SECTION_ID = 10;
const FULL_CONFIDENCE = 1;
const SINGLE_GROUP_COUNT = 1;
const FIRST_GROUP_INDEX = 0;

const createItem = ({
	extractionSectionId,
	id,
	sourcePageNumber,
}: {
	extractionSectionId: null | number;
	id: number;
	sourcePageNumber: number;
}): ExtractionItemEntity =>
	ExtractionItemEntity.initialize({
		confidence: FULL_CONFIDENCE,
		documentId: DOCUMENT_ID,
		extractionSectionId,
		heading: null,
		id,
		knowledgeNodeId: null,
		position: id,
		rationale: "Source",
		sourceExcerpt: "Source",
		sourcePageNumber,
		status: ExtractionItemStatus.PENDING,
		text: "Text",
		title: "Title",
	});

const toIds = (group: ExtractionItemEntity[] | undefined): number[] =>
	(group ?? []).map((item) => item.toObject().id);

void describe("groupBySection", () => {
	void it("puts unsectioned items from different pages into one group", () => {
		const groups = groupBySection([
			createItem({
				extractionSectionId: null,
				id: FIRST_ITEM_ID,
				sourcePageNumber: FIRST_PAGE,
			}),
			createItem({
				extractionSectionId: null,
				id: SECOND_ITEM_ID,
				sourcePageNumber: SECOND_PAGE,
			}),
		]);

		assert.equal(groups.length, SINGLE_GROUP_COUNT);
	});

	void it("keeps sectioned items grouped by their section", () => {
		const groups = groupBySection([
			createItem({
				extractionSectionId: SECTION_ID,
				id: FIRST_ITEM_ID,
				sourcePageNumber: FIRST_PAGE,
			}),
			createItem({
				extractionSectionId: SECTION_ID,
				id: SECOND_ITEM_ID,
				sourcePageNumber: SECOND_PAGE,
			}),
		]);

		assert.equal(groups.length, SINGLE_GROUP_COUNT);
	});

	void it("keeps item order inside a group", () => {
		const groups = groupBySection([
			createItem({
				extractionSectionId: null,
				id: FIRST_ITEM_ID,
				sourcePageNumber: FIRST_PAGE,
			}),
			createItem({
				extractionSectionId: null,
				id: SECOND_ITEM_ID,
				sourcePageNumber: SECOND_PAGE,
			}),
		]);

		assert.deepEqual(toIds(groups[FIRST_GROUP_INDEX]), [
			FIRST_ITEM_ID,
			SECOND_ITEM_ID,
		]);
	});
});
