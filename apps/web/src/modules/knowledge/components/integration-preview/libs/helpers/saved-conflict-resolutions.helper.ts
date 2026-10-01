import { type FieldConflict } from "~/modules/knowledge/libs/types/types.js";

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

export { hasSavedResolutions, withSavedResolutions };
