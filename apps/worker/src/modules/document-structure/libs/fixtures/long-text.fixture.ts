import { type ParsedPageBlock } from "~/parsers/libs/types/parsed-page-block.type.js";

const LONG_TEXT_PAGE_NUMBER = 1;
const LONG_TEXT_SECTION_COUNT = 20;
const NUMBER_OFFSET = 1;
const PARAGRAPH_REPETITIONS = 16;
const SECTION_SEPARATOR = "\n\n";

const toSection = (index: number): string => {
	const number = String(index + NUMBER_OFFSET);
	const paragraph = `Rule ${number} describes how the team reviews proposal ${number} before it is approved. `;

	return `## Section ${number}\n${paragraph.repeat(PARAGRAPH_REPETITIONS).trim()}`;
};

const LONG_TEXT_CONTENT = [
	"# Operations Handbook",
	...Array.from({ length: LONG_TEXT_SECTION_COUNT }, (_, index) =>
		toSection(index),
	),
].join(SECTION_SEPARATOR);

const LONG_TEXT_PAGES: ParsedPageBlock[] = [
	{ content: LONG_TEXT_CONTENT, pageNumber: LONG_TEXT_PAGE_NUMBER },
];

export { LONG_TEXT_CONTENT, LONG_TEXT_PAGES, LONG_TEXT_SECTION_COUNT };
