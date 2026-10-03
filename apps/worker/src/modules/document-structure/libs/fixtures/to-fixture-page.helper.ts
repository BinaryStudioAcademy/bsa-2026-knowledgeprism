import { type ParsedPageBlock } from "~/parsers/libs/types/parsed-page-block.type.js";

const FixtureFontSize = {
	BODY: 12,
	HEADING: 14,
	TITLE: 22,
} as const;

type FixtureLine = {
	fontSize: number;
	text: string;
};

const LINE_BREAK = "\n";

const heading = (text: string): FixtureLine => ({
	fontSize: FixtureFontSize.HEADING,
	text,
});

const body = (text: string): FixtureLine => ({
	fontSize: FixtureFontSize.BODY,
	text,
});

const toFixturePage = (
	pageNumber: number,
	lines: FixtureLine[],
): ParsedPageBlock => ({
	content: lines.map(({ text }) => text).join(LINE_BREAK),
	lines,
	pageNumber,
});

export { body, heading, toFixturePage };
