import { KnowledgeNodeType } from "@knowledgeprism/constants";
import {
	type IntegrationChangeResponseDto,
	type IntegrationChangesResponseDto,
} from "@knowledgeprism/types";

import { type ProposedPage, type ProposedSection } from "../types/types.js";
import { mapIntegrationChangeTypeToChangeStatus } from "./map-integration-change-type-to-change-status.helper.js";

const PROPOSED_CHANGES_SECTION_ID = "proposed-changes-section";
const PROPOSED_CHANGES_SECTION_TITLE = "Proposed changes";

const EMPTY_LENGTH = 0;

const mapIntegrationChangeToPage = (
	item: IntegrationChangeResponseDto,
): ProposedPage => {
	const page: ProposedPage = {
		content: item.incomingContent,
		id: String(item.extractionItemId),
		integrationChangeId: item.id,
		status: mapIntegrationChangeTypeToChangeStatus(item.type),
		title: item.incomingTitle,
		type: KnowledgeNodeType.ENTRY,
	};

	if (item.explanation.trim() !== "") {
		page.explanation = item.explanation;
	}

	if (item.matchedNodeId != null) {
		page.matchedNodeId = item.matchedNodeId;
	}

	if (item.liveTitle != null) {
		page.originalTitle = item.liveTitle;
	}

	if (item.liveContent != null) {
		page.originalContent = item.liveContent;
	}

	return page;
};

const mapIntegrationChangesToProposedStructure = (
	response: IntegrationChangesResponseDto,
): ProposedSection[] => {
	const pages = Array.from(response.items, (item) =>
		mapIntegrationChangeToPage(item),
	);

	if (pages.length === EMPTY_LENGTH) {
		return [];
	}

	const [firstPage] = pages;

	return [
		{
			id: PROPOSED_CHANGES_SECTION_ID,
			pages,
			status: firstPage?.status ?? "created",
			title: PROPOSED_CHANGES_SECTION_TITLE,
			type: KnowledgeNodeType.SECTION,
		},
	];
};

export { mapIntegrationChangesToProposedStructure };
