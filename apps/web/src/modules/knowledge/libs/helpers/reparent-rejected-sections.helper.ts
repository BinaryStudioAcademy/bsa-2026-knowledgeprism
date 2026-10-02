import { type ProposedPage, type ProposedSection } from "../types/types.js";

const FIRST_LABEL_INDEX = 0;
const PlacementLabel = {
	NEW_ROOT: "New root",
	ORDER_SEPARATOR: ", Order ",
	UNDER_PREFIX: "Under ",
} as const;

const findPlacementAncestor = (
	section: ProposedPage,
	rejectedById: ReadonlyMap<string, ProposedPage>,
): ProposedPage | undefined => {
	const visited = new Set([section.id]);
	let parent = rejectedById.get(
		String(section.placementParentExtractionItemId),
	);

	while (parent && !visited.has(parent.id)) {
		visited.add(parent.id);
		const nextParent = rejectedById.get(
			String(parent.placementParentExtractionItemId),
		);

		if (!nextParent) {
			return parent;
		}

		parent = nextParent;
	}

	return undefined;
};

const reparentRejectedSections = (
	pages: ProposedSection[],
	rejected: ProposedPage[],
): ProposedSection[] => {
	const rejectedById = new Map(
		rejected.map((section) => [section.id, section]),
	);
	const retainedById = new Map(
		pages.flatMap((page) =>
			page.pages.map((section) => [section.id, section] as const),
		),
	);

	return pages.map((page) => ({
		...page,
		pages: page.pages.map((section) => {
			if (!rejectedById.has(String(section.placementParentExtractionItemId))) {
				return section;
			}

			const ancestor = findPlacementAncestor(section, rejectedById);
			const parentExtractionItemId =
				ancestor?.placementParentExtractionItemId ?? null;
			const parent = retainedById.get(String(parentExtractionItemId));

			return {
				...section,
				placementParentExtractionItemId: parentExtractionItemId,
				placementParentId: ancestor?.placementParentId ?? null,
				proposedPlace: parent
					? `${PlacementLabel.UNDER_PREFIX}${parent.title}`
					: (ancestor?.proposedPlace
							?.split(PlacementLabel.ORDER_SEPARATOR)
							.at(FIRST_LABEL_INDEX) ?? PlacementLabel.NEW_ROOT),
			};
		}),
	}));
};

export { reparentRejectedSections };
