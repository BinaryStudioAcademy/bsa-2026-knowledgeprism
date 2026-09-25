import { IntegrationResolution } from "@knowledgeprism/constants";
import { type IntegrationConflictResolutionDto } from "@knowledgeprism/types";

import { type ValueOf } from "~/lib/types/types.js";

import { type FieldConflict, type ProposedSection } from "../types/types.js";

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
			.filter((page) => page.status === "conflict")
			.map((page) => page.integrationChangeId),
	);

	return [...conflictChangeIds].map((changeId) => ({
		changeId,
		content: getFieldResolution({ changeId, conflicts, field: "content" }),
		title: getFieldResolution({ changeId, conflicts, field: "title" }),
	}));
};

export { toConflictResolutions };
