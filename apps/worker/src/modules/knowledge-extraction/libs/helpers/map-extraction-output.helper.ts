import {
	ExtractionBlockBackground,
	type ExtractionContentBlock,
	ExtractionHeadingLevel,
} from "@knowledgeprism/types";

import {
	ExtractionItemRejection,
	ExtractionOutputError,
	ExtractionOutputFailure,
	type Rejection,
} from "../exceptions/extraction-output-error.exception.js";
import { type KnowledgeItem } from "../types/knowledge-item.type.js";
import {
	createSourceVocabulary,
	isGroundedText,
} from "./is-grounded-text.helper.js";
import { locateSourceSpan } from "./locate-source-span.helper.js";
import { promoteParallelItems } from "./promote-parallel-items.helper.js";

const CalloutLabel = {
	decision: "Decision",
	note: "Note",
	warning: "Warning",
} as const;

const CalloutVariant = {
	DECISION: "decision",
	NOTE: "note",
	WARNING: "warning",
} as const;

const ConfidenceRange = {
	MAX: 1,
	MIN: 0,
} as const;

const ExtractionBlockType = {
	BULLET_LIST_ITEM: "bulletListItem",
	CALLOUT: "callout",
	CHECK_LIST_ITEM: "checkListItem",
	HEADING: "heading",
	NUMBERED_LIST_ITEM: "numberedListItem",
	PARAGRAPH: "paragraph",
} as const;

const HEADING_LEVELS = new Set<number>([
	ExtractionHeadingLevel.NESTED,
	ExtractionHeadingLevel.SECTION,
]);

const StyleKey = {
	BACKGROUND_COLOR: "backgroundColor",
	BOLD: "bold",
} as const;

const TextRunType = {
	TEXT: "text",
} as const;

const ALLOWED_STYLE_KEYS = new Set<string>([
	StyleKey.BACKGROUND_COLOR,
	StyleKey.BOLD,
]);
const EMPTY_LENGTH = 0;
const FIRST_BLOCK_INDEX = 0;
const LINE_BREAK_LENGTH = 1;
const MARKDOWN_FENCE = "```";
const NOT_FOUND_INDEX = -1;
const ORDER_MINIMUM = 1;
const ROOT_KEY_COUNT = 1;
const SECTION_RATIONALE = "Extracted from the source section.";
const TITLE_MAXIMUM_LENGTH = 80;
const YELLOW_BACKGROUND = "yellow";

type Checked<T> =
	{ rejection: null; value: T } | { rejection: Rejection; value: null };

const accept = <T>(value: T): Checked<T> => ({ rejection: null, value });

const reject = <T>(rejection: Rejection): Checked<T> => ({
	rejection,
	value: null,
});

type CalloutVariantValue = (typeof CalloutVariant)[keyof typeof CalloutVariant];

type HeadingLevelValue =
	(typeof ExtractionHeadingLevel)[keyof typeof ExtractionHeadingLevel];

const isRecord = (value: unknown): value is Record<string, unknown> => {
	return typeof value === "object" && value !== null && !Array.isArray(value);
};

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

const isOrder = (value: unknown): value is number => {
	return (
		typeof value === "number" &&
		Number.isSafeInteger(value) &&
		value >= ORDER_MINIMUM
	);
};

const CALLOUT_BACKGROUND = {
	[CalloutVariant.DECISION]: ExtractionBlockBackground.DECISION,
	[CalloutVariant.NOTE]: ExtractionBlockBackground.NOTE,
	[CalloutVariant.WARNING]: ExtractionBlockBackground.WARNING,
} as const;

const CALLOUT_VARIANTS = new Set<string>(Object.values(CalloutVariant));

const isHeadingLevel = (value: unknown): value is HeadingLevelValue => {
	return typeof value === "number" && HEADING_LEVELS.has(value);
};

const isCalloutVariant = (value: unknown): value is CalloutVariantValue => {
	return typeof value === "string" && CALLOUT_VARIANTS.has(value);
};

const isAllowedStyles = (value: unknown): value is Record<string, unknown> => {
	if (!isRecord(value)) {
		return false;
	}

	return Object.keys(value).every((key) => {
		if (!ALLOWED_STYLE_KEYS.has(key)) {
			return false;
		}

		if (key === StyleKey.BOLD) {
			return value[key] === true;
		}

		return value[key] === YELLOW_BACKGROUND;
	});
};

const toStoredStyles = (
	value: Record<string, unknown>,
): ExtractionContentBlock["content"][number]["styles"] => {
	const styles: NonNullable<
		ExtractionContentBlock["content"][number]["styles"]
	> = {};

	if (value[StyleKey.BOLD] === true) {
		styles.bold = true;
	}

	if (value[StyleKey.BACKGROUND_COLOR] === YELLOW_BACKGROUND) {
		styles.backgroundColor = YELLOW_BACKGROUND;
	}

	if (styles.bold !== true && styles.backgroundColor === undefined) {
		return undefined;
	}

	return styles;
};

const toStoredRun = (
	value: unknown,
): ExtractionContentBlock["content"][number] | null => {
	if (!isRecord(value) || value["type"] !== TextRunType.TEXT) {
		return null;
	}

	if (typeof value["text"] !== "string") {
		return null;
	}

	if ("styles" in value && !isAllowedStyles(value["styles"])) {
		return null;
	}

	const run: ExtractionContentBlock["content"][number] = {
		text: value["text"],
		type: TextRunType.TEXT,
	};

	if (isRecord(value["styles"])) {
		const styles = toStoredStyles(value["styles"]);

		if (styles) {
			run.styles = styles;
		}
	}

	return run;
};

const readContent = (
	block: Record<string, unknown>,
): ExtractionContentBlock["content"] | null => {
	const content = block["content"];

	if (!Array.isArray(content)) {
		return null;
	}

	const runs: ExtractionContentBlock["content"] = [];

	for (const run of content) {
		const storedRun = toStoredRun(run);

		if (!storedRun) {
			return null;
		}

		runs.push(storedRun);
	}

	return runs;
};

const readBlockText = (content: ExtractionContentBlock["content"]): string => {
	return content.map((run) => run.text).join("");
};

const withLeadingSpace = (text: string): string => {
	return /^\s/u.test(text) ? text : ` ${text}`;
};

const toCalloutParagraph = (
	content: ExtractionContentBlock["content"],
	variant: CalloutVariantValue,
): ExtractionContentBlock => {
	const label: ExtractionContentBlock["content"][number] = {
		styles: { bold: true },
		text: CalloutLabel[variant],
		type: TextRunType.TEXT,
	};
	const [firstRun, ...otherRuns] = content;
	const rest = firstRun
		? [{ ...firstRun, text: withLeadingSpace(firstRun.text) }, ...otherRuns]
		: [];

	return {
		content: [label, ...rest],
		props: { backgroundColor: CALLOUT_BACKGROUND[variant] },
		type: ExtractionBlockType.PARAGRAPH,
	};
};

const readHeadingLevel = (
	block: Record<string, unknown>,
): HeadingLevelValue | null => {
	if (!isRecord(block["props"]) || !isHeadingLevel(block["props"]["level"])) {
		return null;
	}

	return block["props"]["level"];
};

const readChecked = (block: Record<string, unknown>): boolean | null => {
	if (!("props" in block) || block["props"] === undefined) {
		return false;
	}

	if (!isRecord(block["props"])) {
		return null;
	}

	if (
		!("checked" in block["props"]) ||
		block["props"]["checked"] === undefined
	) {
		return false;
	}

	return typeof block["props"]["checked"] === "boolean"
		? block["props"]["checked"]
		: null;
};

const toStoredBlock = (value: unknown): ExtractionContentBlock | null => {
	if (!isRecord(value) || typeof value["type"] !== "string") {
		return null;
	}

	const content = readContent(value);

	if (!content) {
		return null;
	}

	switch (value["type"]) {
		case ExtractionBlockType.BULLET_LIST_ITEM:
		case ExtractionBlockType.NUMBERED_LIST_ITEM:
		case ExtractionBlockType.PARAGRAPH: {
			return { content, type: value["type"] };
		}
		case ExtractionBlockType.CALLOUT: {
			const variant = isRecord(value["props"])
				? value["props"]["variant"]
				: undefined;

			if (!isCalloutVariant(variant)) {
				return null;
			}

			return toCalloutParagraph(content, variant);
		}
		case ExtractionBlockType.CHECK_LIST_ITEM: {
			const checked = readChecked(value);

			if (checked === null) {
				return null;
			}

			return {
				content,
				props: { checked },
				type: ExtractionBlockType.CHECK_LIST_ITEM,
			};
		}
		case ExtractionBlockType.HEADING: {
			const level = readHeadingLevel(value);

			if (level === null) {
				return null;
			}

			return {
				content,
				props: { level },
				type: ExtractionBlockType.HEADING,
			};
		}
		default: {
			return null;
		}
	}
};

const readRawBlockText = (block: unknown): string => {
	const content = isRecord(block) ? readContent(block) : null;

	return content ? readBlockText(content) : "";
};

type StoredSection = {
	blocks: ExtractionContentBlock[];
	isHeadingInherited: boolean;
};

const toStoredBlocks = (
	blocks: unknown[],
	heading: string,
	{
		canInheritHeading,
		vocabulary,
	}: { canInheritHeading: boolean; vocabulary: Set<string> },
): Checked<StoredSection> => {
	const storedBlocks: ExtractionContentBlock[] = [];
	let isHeadingInherited = false;

	for (const [index, block] of blocks.entries()) {
		const storedBlock = toStoredBlock(block);

		if (!storedBlock) {
			return reject(ExtractionItemRejection.INVALID_BLOCK);
		}

		if (!isGroundedText(readRawBlockText(block), vocabulary)) {
			if (index !== FIRST_BLOCK_INDEX || !canInheritHeading) {
				return reject(ExtractionItemRejection.UNGROUNDED_TEXT);
			}

			isHeadingInherited = true;
		}

		if (index === FIRST_BLOCK_INDEX) {
			const isSectionHeading =
				storedBlock.type === ExtractionBlockType.HEADING &&
				storedBlock.props?.level === ExtractionHeadingLevel.SECTION &&
				readBlockText(storedBlock.content) === heading;

			if (!isSectionHeading) {
				return reject(ExtractionItemRejection.HEADING_BLOCK_MISMATCH);
			}
		}

		storedBlocks.push(storedBlock);
	}

	return accept({ blocks: storedBlocks, isHeadingInherited });
};

const toPlainText = (blocks: ExtractionContentBlock[]): string => {
	return blocks
		.map((block) => readBlockText(block.content).trim())
		.filter((text) => text !== "")
		.join("\n\n");
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

	try {
		return JSON.parse(stripMarkdownFence(raw.trim())) as unknown;
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

const readCandidateRejection = (
	candidate: Record<string, unknown>,
	chunkContent: string,
): null | Rejection => {
	const { blocks, confidence, heading, order, sourceExcerpt } = candidate;

	if (!isNonEmptyString(heading) || heading.length > TITLE_MAXIMUM_LENGTH) {
		return ExtractionItemRejection.INVALID_HEADING;
	}

	if (!isOrder(order)) {
		return ExtractionItemRejection.INVALID_ORDER;
	}

	if (
		!isNonEmptyString(sourceExcerpt) ||
		locateSourceSpan(chunkContent, sourceExcerpt) === null
	) {
		return ExtractionItemRejection.EXCERPT_NOT_IN_CHUNK;
	}

	if (!isConfidence(confidence)) {
		return ExtractionItemRejection.INVALID_CONFIDENCE;
	}

	if (!Array.isArray(blocks) || blocks.length === EMPTY_LENGTH) {
		return ExtractionItemRejection.MISSING_BLOCKS;
	}

	return null;
};

const toKnowledgeItem = (
	candidate: unknown,
	pageNumber: number,
	{
		canInheritHeading,
		chunkContent,
	}: { canInheritHeading: boolean; chunkContent: string },
): Checked<KnowledgeItem> => {
	if (!isRecord(candidate)) {
		return reject(ExtractionItemRejection.NOT_AN_OBJECT);
	}

	const rejection = readCandidateRejection(candidate, chunkContent);

	if (rejection) {
		return reject(rejection);
	}

	const { blocks, confidence, heading, order, sourceExcerpt } = candidate as {
		blocks: unknown[];
		confidence: number;
		heading: string;
		order: number;
		sourceExcerpt: string;
	};
	const storedBlocks = toStoredBlocks(blocks, heading, {
		canInheritHeading,
		vocabulary: createSourceVocabulary(chunkContent),
	});

	if (storedBlocks.rejection) {
		return reject(storedBlocks.rejection);
	}

	const sourceSpan =
		locateSourceSpan(chunkContent, sourceExcerpt) ?? sourceExcerpt.trim();
	const promotedBlocks = promoteParallelItems(
		storedBlocks.value.blocks,
		sourceSpan,
	);
	const text = toPlainText(promotedBlocks);

	if (text.trim() === "") {
		return reject(ExtractionItemRejection.EMPTY_TEXT);
	}

	return accept({
		blocks: promotedBlocks,
		confidence,
		heading,
		...(storedBlocks.value.isHeadingInherited && { isHeadingInherited: true }),
		position: order,
		rationale: SECTION_RATIONALE,
		sourceExcerpt: sourceSpan,
		sourcePageNumber: pageNumber,
		text,
		title: heading,
	});
};

const byPosition = (left: KnowledgeItem, right: KnowledgeItem): number => {
	return left.position - right.position;
};

const readFirstOrder = (candidates: unknown[]): null | number => {
	const orders = candidates
		.map((candidate) => (isRecord(candidate) ? candidate["order"] : null))
		.filter((order): order is number => isOrder(order));

	return orders.length === EMPTY_LENGTH ? null : Math.min(...orders);
};

const withInheritedHeading = (
	item: KnowledgeItem,
	heading: string,
): KnowledgeItem => {
	const [headingBlock, ...bodyBlocks] = item.blocks;
	const blocks = headingBlock
		? [
				{
					...headingBlock,
					content: [{ text: heading, type: TextRunType.TEXT }],
				},
				...bodyBlocks,
			]
		: bodyBlocks;

	return {
		blocks,
		confidence: item.confidence,
		heading,
		position: item.position,
		rationale: item.rationale,
		sourceExcerpt: item.sourceExcerpt,
		sourcePageNumber: item.sourcePageNumber,
		text: toPlainText(blocks),
		title: heading,
	};
};

const mapExtractionOutput = (
	raw: unknown,
	pageNumber: number,
	chunkContent: string,
): KnowledgeItem[] => {
	const candidates = parseExtractionCandidates(raw);
	const firstOrder = readFirstOrder(candidates);

	return candidates
		.map((candidate) => {
			const { rejection, value } = toKnowledgeItem(candidate, pageNumber, {
				canInheritHeading:
					isRecord(candidate) && candidate["order"] === firstOrder,
				chunkContent,
			});

			if (rejection) {
				throw new ExtractionOutputError(
					ExtractionOutputFailure.INVALID_ITEM,
					rejection,
				);
			}

			return value;
		})
		.toSorted(byPosition);
};

export { mapExtractionOutput, withInheritedHeading };
