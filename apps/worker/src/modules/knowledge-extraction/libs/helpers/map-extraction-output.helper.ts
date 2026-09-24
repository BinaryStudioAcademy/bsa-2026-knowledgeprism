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

const ExtractionOutputError = {
	INVALID_SHAPE: "Extraction output is not a JSON array.",
	NO_VALID_ITEMS: "Extraction output contains no valid items.",
} as const;

const TITLE_MAXIMUM_LENGTH = 80;
const TITLE_START_INDEX = 0;
const TITLE_ELLIPSIS = "…";
const MARKDOWN_FENCE = "```";
const NOT_FOUND_INDEX = -1;
const LINE_BREAK_LENGTH = 1;
const EMPTY_LENGTH = 0;

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

const stripMarkdownFence = (value: string): string => {
	if (!value.startsWith(MARKDOWN_FENCE) || !value.endsWith(MARKDOWN_FENCE)) {
		return value;
	}

	const firstLineEnd = value.indexOf("\n");
	const contentStart =
		firstLineEnd === NOT_FOUND_INDEX
			? MARKDOWN_FENCE.length
			: firstLineEnd + LINE_BREAK_LENGTH;

	return value.slice(contentStart, -MARKDOWN_FENCE.length).trim();
};

const parseRawValue = (raw: unknown): unknown => {
	if (typeof raw !== "string") {
		return raw;
	}

	return JSON.parse(stripMarkdownFence(raw.trim())) as unknown;
};

const parseExtractionCandidates = (raw: unknown): unknown[] => {
	const parsed = parseRawValue(raw);

	if (!Array.isArray(parsed)) {
		throw new TypeError(ExtractionOutputError.INVALID_SHAPE);
	}

	return parsed;
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
	const candidates = parseExtractionCandidates(raw);
	const items = candidates.filter(isExtractionCandidate).map((candidate) => {
		return toKnowledgeItem(candidate, pageNumber);
	});

	if (candidates.length > EMPTY_LENGTH && items.length === EMPTY_LENGTH) {
		throw new Error(ExtractionOutputError.NO_VALID_ITEMS);
	}

	return items;
};

export { mapExtractionOutput };
