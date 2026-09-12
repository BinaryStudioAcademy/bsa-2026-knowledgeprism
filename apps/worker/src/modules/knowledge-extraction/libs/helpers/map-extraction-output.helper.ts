import { type KnowledgeItem } from "../types/knowledge-item.type.js";

type ExtractionCandidate = {
	confidence: number;
	rationale: string;
	sourceExcerpt: string;
	text: string;
};

const ConfidenceRange = {
	MAX: 1,
	MIN: 0,
} as const;

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
