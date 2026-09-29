import {
	type GlossaryConsistencyMatch,
	type GlossaryConsistencyTerm,
} from "../types/types.js";

const LAST_INDEX_OFFSET = 1;
const REGEX_SPECIAL_CHARACTERS = /[$()*+.?[\\\]^{|}]/gu;
const NOT_A_LETTER_OR_DIGIT_BEFORE = String.raw`(?<![\p{L}\p{N}])`;
const NOT_A_LETTER_OR_DIGIT_AFTER = String.raw`(?![\p{L}\p{N}])`;

type RawConsistencyMatch = {
	explanation: string;
	sourceExcerpt: string;
	suggestedText: string;
	termId: number | string;
};

const isNonEmptyString = (value: unknown): value is string => {
	return typeof value === "string" && value.trim() !== "";
};

// The prompt asks for a JSON number, but a model occasionally serializes it as a numeric
// string instead ("13" rather than 13) — accept both rather than rejecting an otherwise
// valid match over a formatting quirk.
const isValidTermId = (value: unknown): value is number | string => {
	if (typeof value === "number") {
		return Number.isSafeInteger(value);
	}

	return isNonEmptyString(value) && Number.isSafeInteger(Number(value));
};

const toTermId = (value: number | string): number => {
	return typeof value === "number" ? value : Number(value);
};

const isRawConsistencyMatch = (
	value: unknown,
): value is RawConsistencyMatch => {
	if (typeof value !== "object" || value === null) {
		return false;
	}

	return (
		"sourceExcerpt" in value &&
		"termId" in value &&
		"suggestedText" in value &&
		"explanation" in value &&
		isNonEmptyString(value.sourceExcerpt) &&
		isValidTermId(value.termId) &&
		isNonEmptyString(value.suggestedText) &&
		isNonEmptyString(value.explanation)
	);
};

// Despite the prompt requiring ONLY a JSON array, Claude occasionally second-guesses its first
// answer inline ("Wait, let me reconsider...") before restating the real one, which makes the
// full response invalid JSON. The model's actual answer is always the last array in the text, so
// fall back to parsing that instead of rejecting an otherwise usable response.
const parseTrailingJsonArray = (text: string): unknown => {
	const arrayMatches = text.match(/\[[^[\]]*]/g);
	const lastArray = arrayMatches?.at(-LAST_INDEX_OFFSET);

	if (lastArray === undefined) {
		return null;
	}

	try {
		return JSON.parse(lastArray) as unknown;
	} catch {
		return null;
	}
};

const parseRawValue = (raw: unknown): unknown => {
	if (typeof raw !== "string") {
		return raw;
	}

	const trimmed = raw.trim();

	if (trimmed === "") {
		return [];
	}

	try {
		return JSON.parse(trimmed) as unknown;
	} catch {
		return parseTrailingJsonArray(trimmed);
	}
};

// Case-sensitive on purpose: "api" still gets flagged for API, but an excerpt that already
// says "API" is using the canonical name, and a suggestion for it points the wrong way
// (e.g. "the SLA" -> "the Service level agreement").
const hasCanonicalName = (excerpt: string, name: string): boolean =>
	new RegExp(
		NOT_A_LETTER_OR_DIGIT_BEFORE +
			name.replaceAll(REGEX_SPECIAL_CHARACTERS, String.raw`\$&`) +
			NOT_A_LETTER_OR_DIGIT_AFTER,
		"u",
	).test(excerpt);

const toMatch = (
	raw: RawConsistencyMatch,
	content: string,
	termsById: Map<number, GlossaryConsistencyTerm>,
): GlossaryConsistencyMatch | null => {
	const term = termsById.get(toTermId(raw.termId));

	if (
		!term ||
		!content.includes(raw.sourceExcerpt) ||
		hasCanonicalName(raw.sourceExcerpt, term.name)
	) {
		return null;
	}

	return {
		canonicalName: term.name,
		explanation: raw.explanation.trim(),
		matchedTermId: term.id,
		sourceExcerpt: raw.sourceExcerpt,
		suggestedText: raw.suggestedText.trim(),
	};
};

const mapConsistencyOutput = (
	raw: unknown,
	content: string,
	candidates: GlossaryConsistencyTerm[],
): GlossaryConsistencyMatch[] | null => {
	const parsed = parseRawValue(raw);

	if (!Array.isArray(parsed)) {
		return null;
	}

	const rawMatches = parsed.filter(isRawConsistencyMatch);

	if (rawMatches.length !== parsed.length) {
		return null;
	}

	const termsById = new Map(candidates.map((term) => [term.id, term]));

	return rawMatches
		.map((item) => toMatch(item, content, termsById))
		.filter((match) => match !== null);
};

export { mapConsistencyOutput };
