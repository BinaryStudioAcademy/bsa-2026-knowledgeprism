import { type IntegrationChangesApplyRequestDto } from "@knowledgeprism/types";

import { type ProposedSection } from "../types/types.js";

type PublishedPlacements = NonNullable<
	IntegrationChangesApplyRequestDto["placements"]
>;

const toPublishedPlacements = (
	pages: ProposedSection[],
	pageIds: ReadonlySet<number>,
): PublishedPlacements => {
	return pages
		.flatMap((section) => section.pages)
		.map((page, position) => {
			const parentId = page.placementParentId ?? null;

			return {
				changeId: page.integrationChangeId,
				...(page.placementParentExtractionItemId !== undefined && {
					parentExtractionItemId: page.placementParentExtractionItemId,
				}),
				parentId: parentId !== null && pageIds.has(parentId) ? parentId : null,
				position,
			};
		});
};

export { toPublishedPlacements };
