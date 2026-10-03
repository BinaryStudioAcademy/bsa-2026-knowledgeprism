import {
	ExtractionBlockBackground,
	type ExtractionBlockBackgroundValue,
	type ExtractionContentBlock,
	ExtractionHeadingLevel,
	type KnowledgeNodeContentDto,
} from "@knowledgeprism/types";

type BlockTypeValue = ExtractionContentBlock["type"];

type HeadingLevelValue =
	(typeof ExtractionHeadingLevel)[keyof typeof ExtractionHeadingLevel];

type InlineContent = ExtractionContentBlock["content"][number];

const BlockType = {
	BULLET_LIST_ITEM: "bulletListItem",
	CHECK_LIST_ITEM: "checkListItem",
	HEADING: "heading",
	NUMBERED_LIST_ITEM: "numberedListItem",
	PARAGRAPH: "paragraph",
} as const;

const DEFAULT_COLOR = "default";
const EMPTY_LENGTH = 0;
const TEXT_RUN_TYPE = "text";
const YELLOW_TEXT_BACKGROUND = "yellow";

const BLOCK_TYPES = new Set<string>(Object.values(BlockType));
const BLOCK_BACKGROUNDS = new Set<unknown>(
	Object.values(ExtractionBlockBackground),
);
const HEADING_LEVELS = new Set<unknown>(Object.values(ExtractionHeadingLevel));

const isRecord = (value: unknown): value is Record<string, unknown> => {
	return typeof value === "object" && value !== null && !Array.isArray(value);
};

const isHeadingLevel = (value: unknown): value is HeadingLevelValue => {
	return HEADING_LEVELS.has(value);
};

const isBlockBackground = (
	value: unknown,
): value is ExtractionBlockBackgroundValue => {
	return BLOCK_BACKGROUNDS.has(value);
};

const isDefault = (value: unknown): boolean => {
	return value === undefined || value === DEFAULT_COLOR;
};

const toStyles = (value: unknown): InlineContent["styles"] | null => {
	if (value === undefined) {
		return undefined;
	}

	if (!isRecord(value)) {
		return null;
	}

	const { backgroundColor, bold, ...rest } = value;
	const hasOtherStyle = Object.values(rest).some((style) => style !== false);
	const isKnownBackground =
		isDefault(backgroundColor) || backgroundColor === YELLOW_TEXT_BACKGROUND;

	if (hasOtherStyle || !isKnownBackground) {
		return null;
	}

	return {
		...(bold === true && { bold: true }),
		...(backgroundColor === YELLOW_TEXT_BACKGROUND && {
			backgroundColor: YELLOW_TEXT_BACKGROUND,
		}),
	};
};

const toInline = (value: unknown): InlineContent | null => {
	if (
		!isRecord(value) ||
		value["type"] !== TEXT_RUN_TYPE ||
		typeof value["text"] !== "string"
	) {
		return null;
	}

	const styles = toStyles(value["styles"]);

	if (styles === null) {
		return null;
	}

	return {
		...(styles && Object.keys(styles).length > EMPTY_LENGTH && { styles }),
		text: value["text"],
		type: TEXT_RUN_TYPE,
	};
};

const toContent = (value: unknown): InlineContent[] | null => {
	if (typeof value === "string") {
		return [{ text: value, type: TEXT_RUN_TYPE }];
	}

	if (!Array.isArray(value)) {
		return null;
	}

	const content = value.map((inline) => toInline(inline));

	return content.every((inline) => inline !== null) ? content : null;
};

const toBlockProperties = (
	type: BlockTypeValue,
	properties: Record<string, unknown>,
): ExtractionContentBlock["props"] | null => {
	const { backgroundColor, checked, level, textColor } = properties;

	if (!isDefault(textColor)) {
		return null;
	}

	if (type === BlockType.HEADING) {
		return isHeadingLevel(level) ? { level } : null;
	}

	if (type === BlockType.CHECK_LIST_ITEM) {
		return { checked: checked === true };
	}

	if (isDefault(backgroundColor)) {
		return undefined;
	}

	return type === BlockType.PARAGRAPH && isBlockBackground(backgroundColor)
		? { backgroundColor }
		: null;
};

const hasChildren = (block: Record<string, unknown>): boolean => {
	const children = block["children"];

	return Array.isArray(children) && children.length > EMPTY_LENGTH;
};

const toBlock = (
	block: Record<string, unknown>,
): ExtractionContentBlock | null => {
	const type = block["type"];

	if (
		typeof type !== "string" ||
		!BLOCK_TYPES.has(type) ||
		hasChildren(block)
	) {
		return null;
	}

	const blockType = type as BlockTypeValue;
	const content = toContent(block["content"]);
	const properties = toBlockProperties(
		blockType,
		isRecord(block["props"]) ? block["props"] : {},
	);

	if (content === null || properties === null) {
		return null;
	}

	return {
		content,
		...(properties && { props: properties }),
		type: blockType,
	};
};

const toExtractionBlocks = (
	contentJson: KnowledgeNodeContentDto,
): ExtractionContentBlock[] | null => {
	const blocks = contentJson.map((block) => toBlock(block));

	return blocks.every((block) => block !== null) ? blocks : null;
};

export { toExtractionBlocks };
