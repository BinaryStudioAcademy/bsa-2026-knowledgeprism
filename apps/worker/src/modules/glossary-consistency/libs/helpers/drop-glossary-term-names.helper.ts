import {
	type GlossaryConsistencyMatch,
	type GlossaryConsistencyTerm,
} from "../types/types.js";

const REGEX_SPECIAL_CHARACTERS = /[$()*+.?[\\\]^{|}]/gu;
const NOT_A_LETTER_OR_DIGIT_BEFORE = String.raw`(?<![\p{L}\p{N}])`;
const OPTIONAL_PLURAL_ENDING = "s?";
const NOT_A_LETTER_OR_DIGIT_AFTER = String.raw`(?![\p{L}\p{N}])`;

const toTermNamePattern = (name: string): RegExp =>
	new RegExp(
		NOT_A_LETTER_OR_DIGIT_BEFORE +
			name.trim().replaceAll(REGEX_SPECIAL_CHARACTERS, String.raw`\$&`) +
			OPTIONAL_PLURAL_ENDING +
			NOT_A_LETTER_OR_DIGIT_AFTER,
		"iu",
	);

const isReplacingTermName = (
	match: GlossaryConsistencyMatch,
	namePattern: RegExp,
): boolean =>
	namePattern.test(match.sourceExcerpt) &&
	!namePattern.test(match.suggestedText);

const dropGlossaryTermNames = (
	matches: GlossaryConsistencyMatch[],
	terms: readonly GlossaryConsistencyTerm[],
): GlossaryConsistencyMatch[] => {
	const namePatterns = terms.map((term) => ({
		id: term.id,
		pattern: toTermNamePattern(term.name),
	}));

	return matches.filter((match) =>
		namePatterns.every(
			({ id, pattern }) =>
				id === match.matchedTermId || !isReplacingTermName(match, pattern),
		),
	);
};

export { dropGlossaryTermNames };
