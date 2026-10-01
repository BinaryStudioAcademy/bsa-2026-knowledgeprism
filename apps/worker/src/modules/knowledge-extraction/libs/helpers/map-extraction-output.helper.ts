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
const WHITESPACE_RUN = /\s+/u;
const LINE_BREAK = /\n/u;
const SINGLE_SPACE = " ";
const EMPTY_STRING = "";
const TYPOGRAPHIC_SINGLE_QUOTES = /[‘’‚‛′]/gu;
const TYPOGRAPHIC_DOUBLE_QUOTES = /[“”„‟″]/gu;
const TYPOGRAPHIC_DASHES = /[‐-―−]/gu;

const isNonEmptyString = (value: unknown): value is string =>
	typeof value === "string" && value.trim() !== "";

const normalizeForComparison = (text: string): string =>
	text
		.replaceAll(TYPOGRAPHIC_SINGLE_QUOTES, "'")
		.replaceAll(TYPOGRAPHIC_DOUBLE_QUOTES, "\u{22}")
		.replaceAll(TYPOGRAPHIC_DASHES, "-")
		.trim()
		.split(WHITESPACE_RUN)
		.join(SINGLE_SPACE);

const removeWhitespace = (text: string): string =>
	text.split(WHITESPACE_RUN).join(EMPTY_STRING);

const isTextOnPage = (content: string, text: string): boolean => {
	const normalizedText = normalizeForComparison(text);

	return (
		content.includes(normalizedText) ||
		removeWhitespace(content).includes(removeWhitespace(normalizedText))
	);
};

const isExcerptFromBlock = (
	excerpt: string,
	block: ExtractionBlock,
): boolean => {
	const content = normalizeForComparison(block.content);

	if (isTextOnPage(content, excerpt)) {
		return true;
	}

	return excerpt
		.split(LINE_BREAK)
		.filter(isNonEmptyString)
		.every((line) => isTextOnPage(content, line));
};

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
			!isExcerptFromBlock(candidate.sourceExcerpt, block)
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
