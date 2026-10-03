import { type ParsedPageBlock } from "~/parsers/libs/types/parsed-page-block.type.js";

import {
	HEADING_TRAILING_PUNCTUATION,
	HeadingDetection,
	MARKDOWN_HEADING,
	NUMBER_SEPARATOR,
	NUMBERED_HEADING,
} from "../constants/document-structure.constant.js";
import { type DocumentLine } from "../types/types.js";

const FIRST_INDEX = 0;
const INDENTED_LINE = /^\s/u;
const LEVEL_OFFSET = 1;
const LINE_BREAK = /\r?\n/u;
const MARKER_GROUP = 1;

const readTextHeadingLevel = (text: string): null | number => {
	if (INDENTED_LINE.test(text)) {
		return null;
	}

	const trimmed = text.trim();
	const markdown = MARKDOWN_HEADING.exec(trimmed);

	if (markdown) {
		return markdown[MARKER_GROUP]?.length ?? null;
	}

	if (
		trimmed.length > HeadingDetection.MAXIMUM_TEXT_HEADING_LENGTH ||
		HEADING_TRAILING_PUNCTUATION.test(trimmed)
	) {
		return null;
	}

	const numbered = NUMBERED_HEADING.exec(trimmed);

	return numbered
		? (numbered[MARKER_GROUP]?.split(NUMBER_SEPARATOR).length ?? null)
		: null;
};

const detectTextHeadings = (
	pages: ParsedPageBlock[],
): DocumentLine[] | null => {
	const lines = pages.flatMap(({ content, pageNumber }) =>
		content.split(LINE_BREAK).map((text) => ({
			level: readTextHeadingLevel(text),
			pageNumber,
			text,
		})),
	);
	const levels = lines
		.map(({ level }) => level)
		.filter((level): level is number => level !== null);

	if (levels.length < HeadingDetection.MINIMUM_HEADINGS) {
		return null;
	}

	const sectionLevels = [...new Set(levels)]
		.toSorted((left, right) => left - right)
		.slice(FIRST_INDEX, HeadingDetection.SECTION_LEVEL_COUNT);

	return lines.map(({ level, pageNumber, text }) => ({
		headingLevel:
			level !== null && sectionLevels.includes(level)
				? sectionLevels.indexOf(level) + LEVEL_OFFSET
				: null,
		pageNumber,
		text,
	}));
};

export { detectTextHeadings };
