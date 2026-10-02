import { EMPTY_LENGTH } from "../constants/constants.js";
import { type ProposedPage, type ProposedSection } from "../types/types.js";

const mergePlacedPage = (
	page: ProposedPage,
	placed: ProposedPage,
): ProposedPage => {
	return {
		...page,
		...(placed.explanation && { explanation: placed.explanation }),
		integrationChangeId: placed.integrationChangeId,
		...(placed.matchedNodeId !== undefined && {
			matchedNodeId: placed.matchedNodeId,
		}),
		...(placed.originalContent !== undefined && {
			originalContent: placed.originalContent,
		}),
		...(placed.originalTitle !== undefined && {
			originalTitle: placed.originalTitle,
		}),
		...(placed.placementParentExtractionItemId !== undefined && {
			placementParentExtractionItemId: placed.placementParentExtractionItemId,
		}),
		...(placed.placementParentId !== undefined && {
			placementParentId: placed.placementParentId,
		}),
		...(placed.proposedPlace && { proposedPlace: placed.proposedPlace }),
		status: placed.status,
		...(placed.wordingMatches && { wordingMatches: placed.wordingMatches }),
	};
};

const mergePlacementIntoPages = (
	pages: ProposedSection[],
	placement: ProposedSection[],
): ProposedSection[] => {
	if (pages.length === EMPTY_LENGTH) {
		return placement;
	}

	const placedPages = placement.flatMap((section) => section.pages);
	const placedById = new Map(placedPages.map((page) => [page.id, page]));

	return pages.map((section) => ({
		...section,
		pages: section.pages.map((page) => {
			const placed = placedById.get(page.id);

			return placed ? mergePlacedPage(page, placed) : page;
		}),
	}));
};

export { mergePlacementIntoPages };
