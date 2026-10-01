const EMPTY_LENGTH = 0;
const PUNCTUATION_TRIM_STEP = 1;

const UNIFIED_KB_PATTERN = /\binto\s+unified\s+knowledge\s+base\b/giu;
const TELL_ME_ABOUT_PATTERN = /^tell me about\s+/iu;
const HOW_PREFIX_PATTERN = /^how\s+/iu;
const QUESTION_WORD_PATTERN = /^(what|why|when|where|who|which)\s+/iu;
const WORD_SPLIT_PATTERN = /\s+/u;

const CLAUSE_VERBS: ReadonlySet<string> = new Set([
	"aggregates",
	"allows",
	"applies",
	"are",
	"authenticates",
	"authorizes",
	"builds",
	"can",
	"connects",
	"contains",
	"converts",
	"creates",
	"decrypts",
	"delivers",
	"deploys",
	"did",
	"do",
	"does",
	"embeds",
	"enables",
	"encrypts",
	"ensures",
	"extracts",
	"fails",
	"generates",
	"had",
	"handles",
	"has",
	"have",
	"implements",
	"indexes",
	"integrates",
	"is",
	"maintains",
	"manages",
	"monitors",
	"must",
	"operates",
	"organizes",
	"parses",
	"processes",
	"protects",
	"provides",
	"receives",
	"recovers",
	"requires",
	"retrieves",
	"runs",
	"secures",
	"sends",
	"serves",
	"should",
	"stores",
	"supports",
	"synchronizes",
	"syncs",
	"tracks",
	"transforms",
	"uses",
	"validates",
	"was",
	"were",
	"will",
	"works",
]);

const stripTrailingPunctuation = (text: string): string => {
	let trimmed = text.trim();

	while (trimmed.endsWith(".") || trimmed.endsWith(":")) {
		trimmed = trimmed.slice(EMPTY_LENGTH, -PUNCTUATION_TRIM_STEP).trim();
	}

	return trimmed;
};

const hasClauseVerb = (title: string): boolean => {
	const words = title.toLowerCase().split(WORD_SPLIT_PATTERN);

	return words.some((word) => CLAUSE_VERBS.has(word));
};

const formatSuggestedQuestion = (title: string): string => {
	const cleanedTitle = stripTrailingPunctuation(
		title.replaceAll(UNIFIED_KB_PATTERN, "into a unified knowledge base"),
	);

	if (cleanedTitle.length === EMPTY_LENGTH) {
		return "";
	}

	if (TELL_ME_ABOUT_PATTERN.test(cleanedTitle)) {
		return cleanedTitle;
	}

	if (QUESTION_WORD_PATTERN.test(cleanedTitle)) {
		return cleanedTitle.endsWith("?") ? cleanedTitle : `${cleanedTitle}?`;
	}

	if (HOW_PREFIX_PATTERN.test(cleanedTitle)) {
		const withoutHow = cleanedTitle.replace(HOW_PREFIX_PATTERN, "").trim();

		return `Tell me about how ${withoutHow}`;
	}

	if (hasClauseVerb(cleanedTitle)) {
		return `Tell me about how ${cleanedTitle}`;
	}

	return `Tell me about ${cleanedTitle}`;
};

export { formatSuggestedQuestion };
