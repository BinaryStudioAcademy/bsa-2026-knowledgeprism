import { KnowledgeNodeType } from "@knowledgeprism/constants";
import {
	type IntegrationChangeResponseDto,
	type IntegrationChangesResponseDto,
} from "@knowledgeprism/types";

import {
	type ChangeStatus,
	type ProposedPage,
	type ProposedSection,
} from "../types/types.js";
import { mapIntegrationChangeTypeToChangeStatus } from "./map-integration-change-type-to-change-status.helper.js";

const DISPLAY_ORDER_OFFSET = 1;
const NEW_ROOT_PLACE_LABEL = "New root";
const ORDER_LABEL_PREFIX = "Order ";
const PROPOSED_CHANGES_SECTION_ID = "proposed-changes-section";
const PROPOSED_CHANGES_SECTION_TITLE = "Proposed changes";
const UNDER_PLACE_PREFIX = "Under ";

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

	if (item.placement.proposesParent || item.placement.siblingOrder !== null) {
		const proposedParentLabel = item.placement.parentTitle
			? `${UNDER_PLACE_PREFIX}${item.placement.parentTitle}`
			: NEW_ROOT_PLACE_LABEL;
		const parentLabel = item.placement.proposesParent
			? proposedParentLabel
			: "";
		const orderLabel =
			item.placement.siblingOrder === null
				? ""
				: `${ORDER_LABEL_PREFIX}${String(item.placement.siblingOrder + DISPLAY_ORDER_OFFSET)}`;
		page.proposedPlace = [parentLabel, orderLabel]
			.filter((label) => label !== "")
			.join(", ");
	}

	page.placementParentId = item.placement.parentId;

	if (item.placement.matches.length > EMPTY_LENGTH) {
		page.wordingMatches = item.placement.matches.map((match) => ({
			span: match.span,
		}));
	}

	return page;
};

const resolveProposedSectionStatus = (pages: ProposedPage[]): ChangeStatus => {
	const hasConflict = pages.some((page) => page.status === "conflict");

	if (hasConflict) {
		return "conflict";
	}

	const [firstPage] = pages;

	return firstPage?.status ?? "created";
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

	return [
		{
			id: PROPOSED_CHANGES_SECTION_ID,
			pages,
			status: resolveProposedSectionStatus(pages),
			title: PROPOSED_CHANGES_SECTION_TITLE,
			type: KnowledgeNodeType.SECTION,
		},
	];
};

export { mapIntegrationChangesToProposedStructure };
