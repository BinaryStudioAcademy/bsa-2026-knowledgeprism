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

const parseRawValue = (raw: unknown): unknown => {
	if (typeof raw !== "string") {
		return raw;
	}

	const trimmed = raw.trim();

	if (trimmed === "") {
		return null;
	}

	try {
		return JSON.parse(trimmed) as unknown;
	} catch {
		return null;
	}
};

const toNewResult = <T>(explanation: string): IntegrationAnalysisResult<T> => {
	return {
		explanation,
		matchedItem: null,
		score: null,
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

	if (parsed.type === IntegrationChangeType.NEW) {
		if (parsed.matchedIndex !== null) {
			return null;
		}

		return toNewResult(explanation);
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
		score: match.score,
		type: parsed.type,
	};
};

export { mapClassificationOutput };
