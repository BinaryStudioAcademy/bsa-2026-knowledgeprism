import { integrationChangesApplyValidationSchema } from "@knowledgeprism/schemas";
import assert from "node:assert/strict";
import { describe, it } from "node:test";

const CHANGE_ID = 10;
const PARENT_ITEM_ID = 20;
const EXISTING_PARENT_ID = 30;
const FIRST_POSITION = 0;

const parsePlacement = (parent: {
	parentExtractionItemId?: null | number;
	parentId: null | number;
}): ReturnType<typeof integrationChangesApplyValidationSchema.safeParse> =>
	integrationChangesApplyValidationSchema.safeParse({
		contentOverrides: [],
		items: [],
		placements: [{ changeId: CHANGE_ID, ...parent, position: FIRST_POSITION }],
		resolutions: [],
	});

void describe("integration placement schema", () => {
	void it("keeps incoming parent references in the parsed payload", () => {
		const parsed = parsePlacement({
			parentExtractionItemId: PARENT_ITEM_ID,
			parentId: null,
		});
		assert.ok(parsed.success);
		assert.equal(
			parsed.data.placements?.at(FIRST_POSITION)?.parentExtractionItemId,
			PARENT_ITEM_ID,
		);
	});

	void it("accepts existing clients that supply only a knowledge node parent", () => {
		assert.equal(
			parsePlacement({ parentId: EXISTING_PARENT_ID }).success,
			true,
		);
	});

	void it("rejects simultaneous incoming and existing parents", () => {
		assert.equal(
			parsePlacement({
				parentExtractionItemId: PARENT_ITEM_ID,
				parentId: EXISTING_PARENT_ID,
			}).success,
			false,
		);
	});

	void it("rejects invalid incoming identifiers", () => {
		assert.equal(
			parsePlacement({ parentExtractionItemId: FIRST_POSITION, parentId: null })
				.success,
			false,
		);
	});
});
