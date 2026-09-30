import { EXTRACTION_OUTPUT_SCHEMA } from "../constants/extraction-output-schema.constant.js";
import {
	ExtractionOutputError,
	ExtractionOutputFailure,
} from "../exceptions/extraction-output-error.exception.js";
import { type ExtractionBlock } from "../types/extraction-block.type.js";
import { type KnowledgeItem } from "../types/knowledge-item.type.js";

type ExtractionCandidate = Omit<KnowledgeItem, "sourcePageNumber">;

const ConfidenceRange = { MAX: 1, MIN: 0 } as const;
const TITLE_MAXIMUM_LENGTH = 80;
const ROOT_KEY_COUNT = 1;

const isNonEmptyString = (value: unknown): value is string =>
	typeof value === "string" && value.trim() !== "";

const isExtractionCandidate = (
	value: unknown,
): value is ExtractionCandidate => {
	if (typeof value !== "object" || value === null) {
		return false;
	}

	return (
		Object.keys(value).length ===
			EXTRACTION_OUTPUT_SCHEMA.properties.items.items.required.length &&
		"confidence" in value &&
		typeof value.confidence === "number" &&
		Number.isFinite(value.confidence) &&
		value.confidence >= ConfidenceRange.MIN &&
		value.confidence <= ConfidenceRange.MAX &&
		"rationale" in value &&
		isNonEmptyString(value.rationale) &&
		"sourceExcerpt" in value &&
		isNonEmptyString(value.sourceExcerpt) &&
		"text" in value &&
		isNonEmptyString(value.text) &&
		"title" in value &&
		isNonEmptyString(value.title) &&
		value.title.trim().length <= TITLE_MAXIMUM_LENGTH
	);
};

const parseRawValue = (raw: unknown): unknown => {
	if (typeof raw !== "string") {
		return raw;
	}

	try {
		return JSON.parse(raw) as unknown;
	} catch {
		throw new ExtractionOutputError(ExtractionOutputFailure.INVALID_JSON);
	}
};

const parseExtractionCandidates = (raw: unknown): unknown[] => {
	const parsed = parseRawValue(raw);

	if (
		typeof parsed !== "object" ||
		parsed === null ||
		Object.keys(parsed).length !== ROOT_KEY_COUNT ||
		!("items" in parsed) ||
		!Array.isArray(parsed.items)
	) {
		throw new ExtractionOutputError(ExtractionOutputFailure.INVALID_SHAPE);
	}

	return parsed.items;
};

const mapExtractionOutput = (
	raw: unknown,
	block: ExtractionBlock,
): KnowledgeItem[] => {
	return parseExtractionCandidates(raw).map((candidate) => {
		if (
			!isExtractionCandidate(candidate) ||
			!block.content.includes(candidate.sourceExcerpt.trim())
		) {
			throw new ExtractionOutputError(ExtractionOutputFailure.INVALID_ITEM);
		}

		return {
			confidence: candidate.confidence,
			rationale: candidate.rationale.trim(),
			sourceExcerpt: candidate.sourceExcerpt.trim(),
			sourcePageNumber: block.pageNumber,
			text: candidate.text.trim(),
			title: candidate.title.trim(),
		};
	});
};

export { mapExtractionOutput };
