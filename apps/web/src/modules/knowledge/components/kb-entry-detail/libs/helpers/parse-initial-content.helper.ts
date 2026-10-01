import { type PartialBlock } from "@blocknote/core";

const EMPTY_COUNT = 0;
const HEADING_BLOCK_TYPE = "heading";

const DEFAULT_BLOCKS: PartialBlock[] = [
	{
		type: "paragraph",
	},
];

const isBlockArray = (value: unknown): value is PartialBlock[] => {
	return Array.isArray(value);
};

const readInlineText = (item: unknown): string => {
	if (typeof item !== "object" || item === null || !("text" in item)) {
		return "";
	}

	return typeof item.text === "string" ? item.text : "";
};

const readBlockText = (block: PartialBlock): string => {
	const { content } = block;

	if (typeof content === "string") {
		return content.trim();
	}

	if (!Array.isArray(content)) {
		return "";
	}

	return content
		.map((item) => readInlineText(item))
		.join("")
		.trim();
};

const omitRepeatedTitle = (
	blocks: PartialBlock[],
	title?: string,
): PartialBlock[] => {
	const trimmedTitle = title?.trim() ?? "";
	const [first, ...rest] = blocks;

	if (
		!first ||
		trimmedTitle === "" ||
		first.type !== HEADING_BLOCK_TYPE ||
		readBlockText(first) !== trimmedTitle
	) {
		return blocks;
	}

	return rest.length > EMPTY_COUNT ? rest : DEFAULT_BLOCKS;
};

const parseInitialContent = (
	content?: unknown,
	title?: string,
): PartialBlock[] => {
	if (!content) {
		return DEFAULT_BLOCKS;
	}

	if (isBlockArray(content)) {
		const blocks = content.length > EMPTY_COUNT ? content : DEFAULT_BLOCKS;

		return omitRepeatedTitle(blocks, title);
	}

	return DEFAULT_BLOCKS;
};

export { parseInitialContent };
