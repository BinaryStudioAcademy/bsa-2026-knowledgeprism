const ENGLISH_STOP_WORDS = new Set([
	"a",
	"an",
	"and",
	"are",
	"as",
	"at",
	"be",
	"by",
	"can",
	"for",
	"from",
	"in",
	"is",
	"it",
	"not",
	"of",
	"on",
	"or",
	"that",
	"the",
	"this",
	"to",
	"will",
	"with",
]);

const EnglishDetection = {
	MINIMUM_LATIN_RATIO: 0.995,
	MINIMUM_STOP_WORD_RATIO: 0.03,
	MINIMUM_WORDS_FOR_STOP_WORDS: 20,
} as const;

export { ENGLISH_STOP_WORDS, EnglishDetection };
