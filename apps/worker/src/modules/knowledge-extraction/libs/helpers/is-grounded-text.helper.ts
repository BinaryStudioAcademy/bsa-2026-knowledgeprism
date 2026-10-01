const Grounding = {
	MINIMUM_RATIO: 0.8,
	MINIMUM_WORD_LENGTH: 3,
	SHORT_TEXT_WORD_COUNT: 4,
	STEM_LENGTH: 5,
	STEM_START: 0,
} as const;

const DIGIT = /\p{N}/u;
const WORD_SEPARATOR = /[^\p{L}\p{N}]+/u;

const toWords = (text: string): string[] => {
	return text
		.toLowerCase()
		.split(WORD_SEPARATOR)
		.filter(
			(word) =>
				word.length >= Grounding.MINIMUM_WORD_LENGTH || DIGIT.test(word),
		);
};

const toStem = (word: string): string => {
	return DIGIT.test(word)
		? word
		: word.slice(Grounding.STEM_START, Grounding.STEM_LENGTH);
};

const createSourceVocabulary = (sourceText: string): Set<string> => {
	return new Set(toWords(sourceText).map((word) => toStem(word)));
};

const isGroundedText = (text: string, vocabulary: Set<string>): boolean => {
	const words = toWords(text);

	if (words.some((word) => DIGIT.test(word) && !vocabulary.has(word))) {
		return false;
	}

	const groundedCount = words.filter((word) =>
		vocabulary.has(toStem(word)),
	).length;

	if (words.length <= Grounding.SHORT_TEXT_WORD_COUNT) {
		return groundedCount === words.length;
	}

	return groundedCount / words.length >= Grounding.MINIMUM_RATIO;
};

export { createSourceVocabulary, isGroundedText };
