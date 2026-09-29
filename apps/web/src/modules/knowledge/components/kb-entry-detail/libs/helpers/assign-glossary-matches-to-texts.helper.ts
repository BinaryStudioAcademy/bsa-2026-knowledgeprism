import { type GlossaryConsistencyMatchDto } from "@knowledgeprism/types";

// A single check-consistency request can cover several batched block texts; this assigns
// each returned match back to every text it was found in (a match's sourceExcerpt is
// guaranteed to occur verbatim in at least one of the checked texts), so each text's cache
// entry only holds matches that actually apply to it.
const assignGlossaryMatchesToTexts = (
	texts: readonly string[],
	matches: readonly GlossaryConsistencyMatchDto[],
): Map<string, GlossaryConsistencyMatchDto[]> => {
	const matchesByText = new Map<string, GlossaryConsistencyMatchDto[]>();

	for (const text of texts) {
		matchesByText.set(
			text,
			matches.filter((match) => text.includes(match.sourceExcerpt)),
		);
	}

	return matchesByText;
};

export { assignGlossaryMatchesToTexts };
