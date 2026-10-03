import { logger } from "~/logger/logger.js";

import { invokeOutline } from "../libs/helpers/invoke-outline.helper.js";
import { mapOutlineOutput } from "../libs/helpers/map-outline-output.helper.js";
import { ClassificationRecovery } from "../libs/helpers/resolve-classification.helper.js";
import { type PlacementTreeNode } from "../libs/types/integration-analysis-parameters.type.js";
import {
	type OutlineSection,
	type SectionOutline,
} from "../libs/types/section-outline.type.js";

const EMPTY_COUNT = 0;

const DOCUMENT_ORDER_OUTLINE: SectionOutline = {
	parentIndex: null,
	parentPriorIndex: null,
	proposesParent: true,
	siblingOrder: null,
};

const placeSections = async ({
	sections,
	tree,
}: {
	sections: OutlineSection[];
	tree: PlacementTreeNode[];
}): Promise<SectionOutline[]> => {
	if (sections.length === EMPTY_COUNT) {
		return [];
	}

	for (
		let attempt: number = ClassificationRecovery.FIRST_ATTEMPT;
		attempt <= ClassificationRecovery.MAXIMUM_ATTEMPTS;
		attempt++
	) {
		const outlines = mapOutlineOutput(await invokeOutline({ sections, tree }), {
			sectionCount: sections.length,
			treeSize: tree.length,
		});

		if (outlines) {
			return outlines;
		}

		logger.warn("Section outline response could not be used.", { attempt });
	}

	logger.warn(
		"Section outline stayed unusable; keeping sections at the top level in document order",
	);

	return sections.map(() => DOCUMENT_ORDER_OUTLINE);
};

export { placeSections };
