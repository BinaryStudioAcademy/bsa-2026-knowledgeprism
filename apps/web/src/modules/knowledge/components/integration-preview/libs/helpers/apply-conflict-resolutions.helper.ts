import {
	type ConflictResolution,
	type FieldConflict,
	type ProposedPage,
	type ProposedSection,
} from "~/modules/knowledge/libs/types/types.js";

const DEFAULT_RESOLUTION: ConflictResolution = "use-new";
const PARAGRAPH_BREAK = "\n\n";

const resolveField = (conflict: FieldConflict): string => {
	const choice = conflict.resolution ?? DEFAULT_RESOLUTION;

	if (choice === "keep") {
		return conflict.currentValue;
	}

	if (choice === "both") {
		return `${conflict.currentValue}${PARAGRAPH_BREAK}${conflict.incomingValue}`;
	}

	return conflict.incomingValue;
};

const resolveSection = (
	section: ProposedPage,
	conflicts: FieldConflict[],
): ProposedPage => {
	const findConflict = (
		field: FieldConflict["field"],
	): FieldConflict | undefined =>
		conflicts.find(
			(conflict) =>
				conflict.field === field &&
				conflict.changeId === section.integrationChangeId,
		);
	const titleConflict = findConflict("title");
	const contentConflict = findConflict("content");

	return {
		...section,
		content: contentConflict ? resolveField(contentConflict) : section.content,
		status: titleConflict || contentConflict ? "modified" : section.status,
		title: titleConflict ? resolveField(titleConflict) : section.title,
	};
};

const applyConflictResolutions = (
	pages: ProposedSection[],
	conflicts: FieldConflict[],
): ProposedSection[] =>
	pages.map((page) => ({
		...page,
		pages: page.pages.map((section) => resolveSection(section, conflicts)),
	}));

const withSavedResolutions = (
	conflicts: FieldConflict[],
	savedConflicts: FieldConflict[],
): FieldConflict[] =>
	conflicts.map((conflict) => {
		const saved = savedConflicts.find((item) => item.id === conflict.id);

		if (!saved) {
			return conflict;
		}

		const decided = { ...conflict };

		if (saved.resolution) {
			decided.resolution = saved.resolution;
		}

		if (saved.matchIndex !== undefined) {
			decided.matchIndex = saved.matchIndex;
		}

		return decided;
	});

const hasSavedResolutions = (
	conflicts: FieldConflict[],
	savedConflicts: FieldConflict[],
): boolean =>
	conflicts.every((conflict) =>
		savedConflicts.some(
			(saved) => saved.id === conflict.id && Boolean(saved.resolution),
		),
	);

export { applyConflictResolutions, hasSavedResolutions, withSavedResolutions };
