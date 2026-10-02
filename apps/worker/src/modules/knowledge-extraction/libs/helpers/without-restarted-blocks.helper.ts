import { type ExtractionContentBlock } from "@knowledgeprism/types";

const NEXT_BLOCK_OFFSET = 1;
const TRAILING_WHITESPACE = /\s$/u;

const readText = (block: ExtractionContentBlock): string => {
	return block.content.map(({ text }) => text).join("");
};

const isRestartedBlock = (
	block: ExtractionContentBlock,
	next: ExtractionContentBlock | undefined,
): boolean => {
	if (!next || next.type !== block.type) {
		return false;
	}

	const text = readText(block);
	const nextText = readText(next);

	return (
		TRAILING_WHITESPACE.test(text) &&
		nextText.length > text.length &&
		nextText.startsWith(text)
	);
};

const withoutRestartedBlocks = (
	blocks: ExtractionContentBlock[],
): ExtractionContentBlock[] => {
	return blocks.filter(
		(block, index) =>
			!isRestartedBlock(block, blocks[index + NEXT_BLOCK_OFFSET]),
	);
};

export { withoutRestartedBlocks };
