import {
	type GlossaryConsistencyMatch,
	type GlossaryConsistencyTerm,
} from "../types/types.js";

const LEADING_ARTICLE = /^(?:a|an|the)\s+/iu;
const PLURAL_SUFFIX = "s";
const SINGULAR_END_INDEX = -PLURAL_SUFFIX.length;
const FIRST_INDEX = 0;

const toComparableName = (text: string): string =>
	text.trim().replace(LEADING_ARTICLE, "").toLowerCase();

const toNameVariants = (name: string): string[] =>
	name.endsWith(PLURAL_SUFFIX)
		? [name, name.slice(FIRST_INDEX, SINGULAR_END_INDEX)]
		: [name];

const dropGlossaryTermNames = (
	matches: GlossaryConsistencyMatch[],
	terms: readonly GlossaryConsistencyTerm[],
): GlossaryConsistencyMatch[] => {
	const termIdsByName = new Map(
		terms.map((term) => [toComparableName(term.name), term.id]),
	);

	return matches.filter((match) =>
		toNameVariants(toComparableName(match.sourceExcerpt)).every((name) => {
			const termId = termIdsByName.get(name);

			return termId === undefined || termId === match.matchedTermId;
		}),
	);
};

export { dropGlossaryTermNames };
