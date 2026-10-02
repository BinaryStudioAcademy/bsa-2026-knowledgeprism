import { IntegrationChangeType } from "@knowledgeprism/constants";
import { type IntegrationChangeResponseDto } from "@knowledgeprism/types";
import { describe, expect, it } from "vitest";

import { type ProposedPage } from "../types/types.js";
import { mapIntegrationChangesToProposedStructure } from "./map-integration-changes-to-proposed-structure.helper.js";

const FIRST_INDEX = 0;

const createChange = (
	mergedBlocks: IntegrationChangeResponseDto["mergedBlocks"],
): IntegrationChangeResponseDto => ({
	explanation: "",
	extractionItemId: 7,
	id: 9,
	incomingContent: "Incoming content",
	incomingTitle: "Password rules",
	liveContent: "Live content",
	liveTitle: "Password rules",
	matchedNodeId: 3,
	mergedBlocks,
	placement: {
		matches: [],
		parentExtractionItemId: null,
		parentId: null,
		parentTitle: null,
		proposesParent: false,
		siblingOrder: null,
	},
	score: null,
	type: IntegrationChangeType.UPDATE,
});

const toPage = (
	mergedBlocks: IntegrationChangeResponseDto["mergedBlocks"],
): ProposedPage | undefined => {
	const [section] = mapIntegrationChangesToProposedStructure({
		items: [createChange(mergedBlocks)],
	});

	return section?.pages.at(FIRST_INDEX);
};

describe("mapIntegrationChangesToProposedStructure", () => {
	it("keeps the merged entry with the text it was merged from", () => {
		const page = toPage([
			{
				content: [{ text: "Keep the 90-day rule.", type: "text" }],
				type: "paragraph",
			},
			{
				content: [{ text: "Add a special character.", type: "text" }],
				type: "bulletListItem",
			},
		]);

		expect(page?.merge).toEqual({
			blocks: [
				{
					content: [
						{ styles: {}, text: "Keep the 90-day rule.", type: "text" },
					],
					type: "paragraph",
				},
				{
					content: [
						{ styles: {}, text: "Add a special character.", type: "text" },
					],
					type: "bulletListItem",
				},
			],
			content: "Keep the 90-day rule.\n\nAdd a special character.",
			incomingContent: "Incoming content",
			incomingTitle: "Password rules",
		});
	});

	it("leaves the merge out when the change has none", () => {
		expect(toPage(null)?.merge).toBeUndefined();
	});
});
