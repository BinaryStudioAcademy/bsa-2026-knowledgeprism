import { type GlossaryConsistencyTerm } from "../types/types.js";

const ACRONYM_PATTERN = /^[A-Z]{2,10}$/u;
const DEFINITION_PHRASE_END = /[(,.:;–—]/u;
const WORD_SEPARATOR = /[\s-]+/u;
const WORD_SEPARATOR_RUN = /[\s-]+/gu;
const REGEX_SPECIAL_CHARACTERS = /[$()*+.?[\\\]^{|}]/gu;
const FIRST_INDEX = 0;

const getSpelledOutForm = ({
	definition,
	name,
}: Pick<GlossaryConsistencyTerm, "definition" | "name">): null | string => {
	if (!ACRONYM_PATTERN.test(name)) {
		return null;
	}

	const [openingPhrase = ""] = definition.split(DEFINITION_PHRASE_END);
	const phrase = openingPhrase.trim();
	const words = phrase.split(WORD_SEPARATOR).filter(Boolean);
	const initials = words
		.map((word) => word.charAt(FIRST_INDEX).toUpperCase())
		.join("");

	return initials === name ? phrase : null;
};

const WORD_SEPARATOR_PATTERN = String.raw`[\s-]+`;
const OPTIONAL_PLURAL_WORD_END = String.raw`s?\b`;
const WORD_START = String.raw`\b`;

const toPhrasePattern = (phrase: string): RegExp => {
	const escapedPhrase = phrase
		.replaceAll(REGEX_SPECIAL_CHARACTERS, String.raw`\$&`)
		.replaceAll(WORD_SEPARATOR_RUN, () => WORD_SEPARATOR_PATTERN);

	return new RegExp(
		WORD_START + escapedPhrase + OPTIONAL_PLURAL_WORD_END,
		"iu",
	);
};

const findSpelledOutTerms = (
	content: string,
	terms: readonly GlossaryConsistencyTerm[],
): GlossaryConsistencyTerm[] =>
	terms.filter((term) => {
		const spelledOutForm = getSpelledOutForm(term);

		return (
			spelledOutForm !== null && toPhrasePattern(spelledOutForm).test(content)
		);
	});

export { findSpelledOutTerms, getSpelledOutForm };
