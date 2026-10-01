import { IntegrationChangeType } from "@knowledgeprism/constants";

import { type SimilarityMatch } from "../../../embeddings/libs/types/similarity-match.type.js";
import { type IntegrationAnalysisResult } from "../types/integration-analysis-result.type.js";
import { type IntegrationChangeTypeValue } from "../types/integration-change-type-value.type.js";

type ClassificationOutput = {
	explanation: string;
	matchedIndex: null | number;
	type: IntegrationChangeTypeValue;
};

const FIRST_INDEX = 0;
const LINE_BREAK_LENGTH = 1;
const MARKDOWN_FENCE = "```";
const NOT_FOUND_INDEX = -1;

const isChangeType = (value: unknown): value is IntegrationChangeTypeValue => {
	return (
		typeof value === "string" &&
		Object.values(IntegrationChangeType).includes(
			value as IntegrationChangeTypeValue,
		)
	);
};

const isNonEmptyString = (value: unknown): value is string => {
	return typeof value === "string" && value.trim() !== "";
};

const isMatchedIndex = (value: unknown): value is null | number => {
	return value === null || Number.isSafeInteger(value);
};

const isClassificationOutput = (
	value: unknown,
): value is ClassificationOutput => {
	if (typeof value !== "object" || value === null) {
		return false;
	}

	return (
		"explanation" in value &&
		"matchedIndex" in value &&
		"type" in value &&
		isNonEmptyString(value.explanation) &&
		isMatchedIndex(value.matchedIndex) &&
		isChangeType(value.type)
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

	const trimmed = stripMarkdownFence(raw.trim());

	if (trimmed === "") {
		return null;
	}

	try {
		return JSON.parse(trimmed) as unknown;
	} catch {
		return null;
	}
};

const isRecord = (value: unknown): value is Record<string, unknown> => {
	return typeof value === "object" && value !== null && !Array.isArray(value);
};

const readContent = (item: unknown): string => {
	if (!isRecord(item) || typeof item["content"] !== "string") {
		return "";
	}

	return item["content"];
};

const readParentIndex = (
	record: Record<string, unknown>,
): { parentIndex: null | number; proposesParent: boolean } => {
	if (!("parentIndex" in record)) {
		return { parentIndex: null, proposesParent: false };
	}

	const parentIndex = record["parentIndex"];

	if (parentIndex === null) {
		return { parentIndex: null, proposesParent: true };
	}

	if (
		typeof parentIndex === "number" &&
		Number.isSafeInteger(parentIndex) &&
		parentIndex >= FIRST_INDEX
	) {
		return { parentIndex, proposesParent: true };
	}

	return { parentIndex: null, proposesParent: false };
};

const readOptionalIndex = (value: unknown): null | number => {
	if (
		typeof value === "number" &&
		Number.isSafeInteger(value) &&
		value >= FIRST_INDEX
	) {
		return value;
	}

	return null;
};

const readMatches = <T>(
	record: Record<string, unknown>,
	candidates: SimilarityMatch<T>[],
): IntegrationAnalysisResult<T>["matches"] => {
	const value = record["matches"];

	if (!Array.isArray(value)) {
		return [];
	}

	const matches: IntegrationAnalysisResult<T>["matches"] = [];

	for (const entry of value) {
		if (!isRecord(entry) || typeof entry["span"] !== "string") {
			continue;
		}

		const index = entry["index"];
		const span = entry["span"].trim();
		const candidate =
			typeof index === "number" && Number.isSafeInteger(index)
				? candidates[index]
				: undefined;

		if (!candidate || span.length === FIRST_INDEX) {
			continue;
		}

		if (!readContent(candidate.item).includes(span)) {
			continue;
		}

		matches.push({ item: candidate.item, span });
	}

	return matches;
};

const toNewResult = <T>(
	explanation: string,
	placement: Pick<
		IntegrationAnalysisResult<T>,
		| "matches"
		| "parentIndex"
		| "parentPriorIndex"
		| "proposesParent"
		| "siblingOrder"
	>,
): IntegrationAnalysisResult<T> => {
	return {
		explanation,
		matchedItem: null,
		matches: placement.matches,
		parentIndex: placement.parentIndex,
		parentPriorIndex: placement.parentPriorIndex,
		proposesParent: placement.proposesParent,
		score: null,
		siblingOrder: placement.siblingOrder,
		type: IntegrationChangeType.NEW,
	};
};

const mapClassificationOutput = <T>(
	raw: unknown,
	matches: SimilarityMatch<T>[],
): IntegrationAnalysisResult<T> | null => {
	const parsed = parseRawValue(raw);

	if (!isClassificationOutput(parsed)) {
		return null;
	}

	const explanation = parsed.explanation.trim();
	const record = parsed as ClassificationOutput & Record<string, unknown>;
	const parent = readParentIndex(record);
	const parentPriorIndex =
		"parentPriorIndex" in record
			? readOptionalIndex(record["parentPriorIndex"])
			: null;
	const placement = {
		matches: readMatches(record, matches),
		parentIndex: parent.parentIndex,
		parentPriorIndex,
		proposesParent: parent.proposesParent || parentPriorIndex !== null,
		siblingOrder:
			"siblingOrder" in record
				? readOptionalIndex(record["siblingOrder"])
				: null,
	};

	if (parsed.type === IntegrationChangeType.NEW) {
		if (parsed.matchedIndex !== null) {
			return null;
		}

		return toNewResult(explanation, placement);
	}

	if (
		parsed.matchedIndex === null ||
		parsed.matchedIndex < FIRST_INDEX ||
		parsed.matchedIndex >= matches.length
	) {
		return null;
	}

	const match = matches[parsed.matchedIndex];

	if (match === undefined) {
		return null;
	}

	return {
		explanation,
		matchedItem: match.item,
		matches: placement.matches,
		parentIndex: placement.parentIndex,
		parentPriorIndex: placement.parentPriorIndex,
		proposesParent: placement.proposesParent,
		score: match.score,
		siblingOrder: placement.siblingOrder,
		type: parsed.type,
	};
};

export { mapClassificationOutput };
