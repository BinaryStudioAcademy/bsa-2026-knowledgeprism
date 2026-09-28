import {
	type GlossaryConsistencyMatch,
	type GlossaryConsistencyTerm,
} from "../types/types.js";

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
		return null;
	}
};

const toMatch = (
	raw: RawConsistencyMatch,
	content: string,
	termsById: Map<number, GlossaryConsistencyTerm>,
): GlossaryConsistencyMatch | null => {
	const term = termsById.get(toTermId(raw.termId));

	if (!term || !content.includes(raw.sourceExcerpt)) {
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
