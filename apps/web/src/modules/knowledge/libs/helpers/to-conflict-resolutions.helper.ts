import { IntegrationResolution } from "@knowledgeprism/constants";
import { type IntegrationConflictResolutionDto } from "@knowledgeprism/types";

import { type ValueOf } from "~/lib/types/types.js";

import { type FieldConflict, type ProposedSection } from "../types/types.js";

const FIRST_MATCH_INDEX = 0;

const getFieldResolution = ({
	changeId,
	conflicts,
	field,
}: {
	changeId: number;
	conflicts: FieldConflict[];
	field: FieldConflict["field"];
}): ValueOf<typeof IntegrationResolution> =>
	conflicts.find(
		(conflict) => conflict.changeId === changeId && conflict.field === field,
	)?.resolution ?? IntegrationResolution.KEEP;

const toConflictResolutions = ({
	conflicts,
	sections,
}: {
	conflicts: FieldConflict[];
	sections: ProposedSection[];
}): IntegrationConflictResolutionDto[] => {
	const conflictChangeIds = new Set(
		sections
			.flatMap((section) => section.pages)
			.filter(
				(page) => page.status === "conflict" || page.status === "duplicate",
			)
			.map((page) => page.integrationChangeId),
	);

	return [...conflictChangeIds].map((changeId) => {
		const contentConflict = conflicts.find(
			(conflict) =>
				conflict.changeId === changeId && conflict.field === "content",
		);
		const resolution: IntegrationConflictResolutionDto = {
			changeId,
			content: getFieldResolution({ changeId, conflicts, field: "content" }),
			title: getFieldResolution({ changeId, conflicts, field: "title" }),
		};

		if (contentConflict?.resolution === IntegrationResolution.BOTH) {
			resolution.matchIndex = contentConflict.matchIndex ?? FIRST_MATCH_INDEX;
		}

		return resolution;
	});
};

export { toConflictResolutions };
