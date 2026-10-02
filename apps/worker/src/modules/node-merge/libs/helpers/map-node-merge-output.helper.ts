import {
	ExtractionBlockBackground,
	type ExtractionBlockBackgroundValue,
	type ExtractionContentBlock,
} from "@knowledgeprism/types";

import {
	createSourceVocabulary,
	isGroundedText,
} from "~/modules/knowledge-extraction/libs/helpers/is-grounded-text.helper.js";
import {
	parseRawValue,
	toPlainText,
	toStoredBlock,
} from "~/modules/knowledge-extraction/libs/helpers/map-extraction-output.helper.js";

import { NodeMerge } from "../constants/node-merge.constant.js";
import { type NodeMergeResult } from "../types/types.js";

const EMPTY_LENGTH = 0;
const PARAGRAPH_BLOCK_TYPE = "paragraph";
const BACKGROUNDS = new Set<string>(Object.values(ExtractionBlockBackground));

const isRecord = (value: unknown): value is Record<string, unknown> => {
	return typeof value === "object" && value !== null && !Array.isArray(value);
};

const isBackground = (
	value: unknown,
): value is ExtractionBlockBackgroundValue => {
	return typeof value === "string" && BACKGROUNDS.has(value);
};

const readBackground = (
	value: Record<string, unknown>,
): ExtractionBlockBackgroundValue | null => {
	const properties = value["props"];

	return isRecord(properties) && isBackground(properties["backgroundColor"])
		? properties["backgroundColor"]
		: null;
};

const toMergedBlock = (value: unknown): ExtractionContentBlock | null => {
	const block = toStoredBlock(value);

	if (!block || !isRecord(value)) {
		return null;
	}

	const backgroundColor = readBackground(value);

	return backgroundColor && block.type === PARAGRAPH_BLOCK_TYPE
		? { ...block, props: { backgroundColor } }
		: block;
};

const readRawBlocks = (raw: unknown): null | unknown[] => {
	try {
		const parsed = parseRawValue(raw);

		return isRecord(parsed) && Array.isArray(parsed["blocks"])
			? parsed["blocks"]
			: null;
	} catch {
		return null;
	}
};

const toBlocks = (rawBlocks: unknown[]): ExtractionContentBlock[] | null => {
	const blocks = rawBlocks.map((block) => toMergedBlock(block));

	return blocks.every((block) => block !== null) ? blocks : null;
};

const toCoverage = (
	blocks: ExtractionContentBlock[],
	sourceVocabulary: Set<string>,
): number => {
	const outputVocabulary = createSourceVocabulary(toPlainText(blocks));
	const keptCount = [...sourceVocabulary].filter((stem) =>
		outputVocabulary.has(stem),
	).length;

	return sourceVocabulary.size === EMPTY_LENGTH
		? NodeMerge.MINIMUM_COVERAGE
		: keptCount / sourceVocabulary.size;
};

const mapNodeMergeOutput = (
	raw: unknown,
	sourceBlocks: ExtractionContentBlock[],
): NodeMergeResult => {
	const rawBlocks = readRawBlocks(raw);
	const blocks = rawBlocks ? toBlocks(rawBlocks) : null;

	if (!blocks || blocks.length === EMPTY_LENGTH) {
		return { blocks: null, coverage: null };
	}

	const sourceVocabulary = createSourceVocabulary(toPlainText(sourceBlocks));
	const coverage = toCoverage(blocks, sourceVocabulary);
	const isGrounded = blocks.every((block) =>
		isGroundedText(toPlainText([block]), sourceVocabulary),
	);

	return {
		blocks:
			isGrounded && coverage >= NodeMerge.MINIMUM_COVERAGE ? blocks : null,
		coverage,
	};
};

export { mapNodeMergeOutput };
