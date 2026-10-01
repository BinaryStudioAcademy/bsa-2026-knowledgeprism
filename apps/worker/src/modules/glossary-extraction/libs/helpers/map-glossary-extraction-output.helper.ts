import { GlossaryValidationRule } from "@knowledgeprism/constants";

import { GlossaryExtractionLimit } from "../constants/glossary-extraction.constant.js";
import { type GlossaryTermCandidate } from "../types/types.js";

const ARRAY_START = "[";
const ARRAY_END = "]";
const NOT_FOUND_INDEX = -1;
const END_INCLUSIVE_OFFSET = 1;
const FIRST_INDEX = 0;

const parseJsonArray = (raw: unknown): unknown[] => {
	if (Array.isArray(raw)) {
		return raw as unknown[];
	}

	if (typeof raw !== "string") {
		return [];
	}

	const start = raw.indexOf(ARRAY_START);
	const end = raw.lastIndexOf(ARRAY_END);

	if (start === NOT_FOUND_INDEX || end < start) {
		return [];
	}

	try {
		const parsed: unknown = JSON.parse(
			raw.slice(start, end + END_INCLUSIVE_OFFSET),
		);

		return Array.isArray(parsed) ? (parsed as unknown[]) : [];
	} catch {
		return [];
	}
};

const toCandidate = (value: unknown): GlossaryTermCandidate | null => {
	if (typeof value !== "object" || value === null) {
		return null;
	}

	const { definition, name } = value as Record<string, unknown>;

	if (typeof name !== "string" || typeof definition !== "string") {
		return null;
	}

	return { definition: definition.trim(), name: name.trim() };
};

const isWithinLimits = ({ definition, name }: GlossaryTermCandidate): boolean =>
	name.length >= GlossaryValidationRule.REQUIRED_MINIMUM_LENGTH &&
	name.length <= GlossaryValidationRule.NAME_MAXIMUM_LENGTH &&
	definition.length >= GlossaryValidationRule.REQUIRED_MINIMUM_LENGTH &&
	definition.length <= GlossaryValidationRule.DEFINITION_MAXIMUM_LENGTH;

const mapGlossaryExtractionOutput = ({
	content,
	existingNames,
	raw,
}: {
	content: string;
	existingNames: readonly string[];
	raw: unknown;
}): GlossaryTermCandidate[] => {
	const lowerCaseContent = content.toLowerCase();
	const takenNames = new Set(existingNames.map((name) => name.toLowerCase()));
	const candidates: GlossaryTermCandidate[] = [];

	for (const value of parseJsonArray(raw)) {
		const candidate = toCandidate(value);
		const lowerCaseName = candidate?.name.toLowerCase() ?? "";

		if (
			candidate &&
			isWithinLimits(candidate) &&
			lowerCaseContent.includes(lowerCaseName) &&
			!takenNames.has(lowerCaseName)
		) {
			takenNames.add(lowerCaseName);
			candidates.push(candidate);
		}
	}

	return candidates.slice(FIRST_INDEX, GlossaryExtractionLimit.TERMS);
};

export { mapGlossaryExtractionOutput };
