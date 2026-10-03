import { type GlossaryConsistencyMatch } from "../types/types.js";

const toMatchKey = (match: GlossaryConsistencyMatch): string => {
	return `${match.matchedTermId.toString()}:${match.sourceExcerpt}`;
};

const toUniqueMatches = (
	matches: GlossaryConsistencyMatch[],
	content: string,
): GlossaryConsistencyMatch[] => {
	const matchesByKey = new Map<string, GlossaryConsistencyMatch>();

	for (const match of matches) {
		const key = toMatchKey(match);

		if (!matchesByKey.has(key) && content.includes(match.sourceExcerpt)) {
			matchesByKey.set(key, match);
		}
	}

	return matchesByKey.values().toArray();
};

export { toUniqueMatches };
