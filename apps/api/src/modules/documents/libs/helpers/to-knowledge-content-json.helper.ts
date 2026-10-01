import {
	type ExtractionContentBlock,
	type KnowledgeNodeContentDto,
} from "@knowledgeprism/types";

const EMPTY_LENGTH = 0;
const HEADING_BLOCK_TYPE = "heading";
const PARAGRAPH_BLOCK_TYPE = "paragraph";
const TEXT_RUN_TYPE = "text";

const blockText = (block: ExtractionContentBlock): string =>
	block.content
		.map((run) => run.text)
		.join("")
		.trim();

const toPlainParagraph = (text: string): KnowledgeNodeContentDto => [
	{ content: text, type: PARAGRAPH_BLOCK_TYPE },
];

const toContentBlock = (
	block: ExtractionContentBlock,
): Record<string, unknown> => ({
	content: block.content.map((run) => ({
		styles: run.styles ?? {},
		text: run.text,
		type: TEXT_RUN_TYPE,
	})),
	...(block.props && { props: block.props }),
	type: block.type,
});

const withoutRepeatedTitle = (
	blocks: ExtractionContentBlock[],
	title: string,
): ExtractionContentBlock[] => {
	const [first, ...rest] = blocks;

	if (!first) {
		return [];
	}

	const isRepeatedTitle =
		first.type === HEADING_BLOCK_TYPE && blockText(first) === title.trim();

	return isRepeatedTitle ? rest : blocks;
};

const toKnowledgeContentJson = ({
	blocks,
	fallbackText,
	title,
}: {
	blocks: ExtractionContentBlock[];
	fallbackText: string;
	title: string;
}): KnowledgeNodeContentDto => {
	if (blocks.length === EMPTY_LENGTH) {
		return toPlainParagraph(fallbackText);
	}

	const body = withoutRepeatedTitle(blocks, title);

	if (body.length === EMPTY_LENGTH) {
		return [];
	}

	return body.map((block) => toContentBlock(block));
};

export { toKnowledgeContentJson };
