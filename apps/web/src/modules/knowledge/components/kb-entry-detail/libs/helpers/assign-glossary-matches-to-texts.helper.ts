import { type GlossaryConsistencyMatchDto } from "@knowledgeprism/types";

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
