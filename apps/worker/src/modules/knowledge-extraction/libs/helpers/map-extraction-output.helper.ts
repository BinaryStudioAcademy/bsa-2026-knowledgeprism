import { type KnowledgeItem } from "../types/knowledge-item.type.js";

type ExtractionCandidate = {
	confidence: number;
	rationale: string;
	sourceExcerpt: string;
	text: string;
	title?: unknown;
};

const ConfidenceRange = {
	MAX: 1,
	MIN: 0,
} as const;

const TITLE_MAXIMUM_LENGTH = 80;
const TITLE_START_INDEX = 0;
const TITLE_ELLIPSIS = "…";

const isFiniteNumber = (value: unknown): value is number => {
	return typeof value === "number" && Number.isFinite(value);
};

const isConfidence = (value: unknown): value is number => {
	return (
		isFiniteNumber(value) &&
		value >= ConfidenceRange.MIN &&
		value <= ConfidenceRange.MAX
	);
};

const isNonEmptyString = (value: unknown): value is string => {
	return typeof value === "string" && value.trim() !== "";
};

const isExtractionCandidate = (
	value: unknown,
): value is ExtractionCandidate => {
	if (typeof value !== "object" || value === null) {
		return false;
	}

	return (
		"confidence" in value &&
		"rationale" in value &&
		"sourceExcerpt" in value &&
		"text" in value &&
		isConfidence(value.confidence) &&
		isNonEmptyString(value.rationale) &&
		isNonEmptyString(value.sourceExcerpt) &&
		isNonEmptyString(value.text)
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
		return [];
	}
};

const parseExtractionCandidates = (raw: unknown): unknown[] => {
	const parsed = parseRawValue(raw);

	return Array.isArray(parsed) ? parsed : [];
};

const toTitle = (candidate: ExtractionCandidate): string => {
	const title = isNonEmptyString(candidate.title)
		? candidate.title.trim()
		: candidate.text.trim();

	if (title.length <= TITLE_MAXIMUM_LENGTH) {
		return title;
	}

	return `${title.slice(TITLE_START_INDEX, TITLE_MAXIMUM_LENGTH - TITLE_ELLIPSIS.length).trimEnd()}${TITLE_ELLIPSIS}`;
};

const toKnowledgeItem = (
	candidate: ExtractionCandidate,
	pageNumber: number,
): KnowledgeItem => {
	return {
		confidence: candidate.confidence,
		rationale: candidate.rationale.trim(),
		sourceExcerpt: candidate.sourceExcerpt.trim(),
		sourcePageNumber: pageNumber,
		text: candidate.text.trim(),
		title: toTitle(candidate),
	};
};

const mapExtractionOutput = (
	raw: unknown,
	pageNumber: number,
): KnowledgeItem[] => {
	return parseExtractionCandidates(raw)
		.filter(isExtractionCandidate)
		.map((candidate) => {
			return toKnowledgeItem(candidate, pageNumber);
		});
};

export { mapExtractionOutput };
