import { type FieldConflict } from "~/modules/knowledge/libs/types/types.js";

const FIRST_MATCH_INDEX = 0;

const withSavedResolutions = (
	conflicts: FieldConflict[],
	savedConflicts: FieldConflict[],
): FieldConflict[] => {
	const wordingMatchesByChangeId = new Map(
		conflicts.flatMap((conflict) =>
			conflict.wordingMatches &&
			conflict.wordingMatches.length > FIRST_MATCH_INDEX
				? [[conflict.changeId, conflict.wordingMatches] as const]
				: [],
		),
	);

	return conflicts.map((conflict) => {
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

			const wordingMatches =
				conflict.wordingMatches ??
				wordingMatchesByChangeId.get(conflict.changeId);
			const match = wordingMatches?.[saved.matchIndex];

			if (match) {
				decided.currentValue =
					conflict.field === "title"
						? (match.title ?? conflict.currentValue)
						: (match.content ?? conflict.currentValue);
				decided.matchedNodeId = match.nodeId ?? conflict.matchedNodeId;
			}
		}

		return decided;
	});
};

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
