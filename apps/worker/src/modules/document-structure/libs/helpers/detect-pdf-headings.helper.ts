import { type ParsedPageBlock } from "~/parsers/libs/types/parsed-page-block.type.js";

import {
	HEADING_LETTER,
	HEADING_TRAILING_PUNCTUATION,
	HeadingDetection,
} from "../constants/document-structure.constant.js";
import { type DocumentLine } from "../types/types.js";

type SizedLine = {
	fontSize: number;
	pageNumber: number;
	text: string;
};

const LEVEL_OFFSET = 1;
const NO_FONT_SIZE = 0;
const OCCURRENCE_STEP = 1;
const SINGLE_OCCURRENCE = 1;

const roundFontSize = (fontSize: null | number): number => {
	return fontSize === null
		? NO_FONT_SIZE
		: Math.round(fontSize * HeadingDetection.FONT_SIZE_ROUNDING) /
				HeadingDetection.FONT_SIZE_ROUNDING;
};

const toSizedLines = (pages: ParsedPageBlock[]): SizedLine[] => {
	return pages.flatMap(({ lines = [], pageNumber }) =>
		lines.map(({ fontSize, text }) => ({
			fontSize: roundFontSize(fontSize),
			pageNumber,
			text,
		})),
	);
};

const findBodyFontSize = (lines: SizedLine[]): number => {
	const charactersBySize = new Map<number, number>();

	for (const { fontSize, text } of lines) {
		charactersBySize.set(
			fontSize,
			(charactersBySize.get(fontSize) ?? NO_FONT_SIZE) + text.length,
		);
	}

	let bodySize = NO_FONT_SIZE;
	let bodyCharacters = NO_FONT_SIZE;

	for (const [fontSize, characters] of charactersBySize) {
		if (characters <= bodyCharacters) {
			continue;
		}

		bodySize = fontSize;
		bodyCharacters = characters;
	}

	return bodySize;
};

const findRunningTexts = (lines: SizedLine[]): Set<string> => {
	const pagesByText = new Map<string, Set<number>>();

	for (const { pageNumber, text } of lines) {
		const pages = pagesByText.get(text) ?? new Set<number>();
		pages.add(pageNumber);
		pagesByText.set(text, pages);
	}

	const runningTexts = new Set<string>();

	for (const [text, pages] of pagesByText) {
		if (pages.size > HeadingDetection.MAXIMUM_REPEATED_PAGES) {
			runningTexts.add(text);
		}
	}

	return runningTexts;
};

const isHeadingCandidate = (
	line: SizedLine,
	bodySize: number,
	runningTexts: Set<string>,
): boolean => {
	return (
		bodySize > NO_FONT_SIZE &&
		line.fontSize >= bodySize * HeadingDetection.FONT_SIZE_RATIO &&
		line.text.length <= HeadingDetection.MAXIMUM_LENGTH &&
		HEADING_LETTER.test(line.text) &&
		!HEADING_TRAILING_PUNCTUATION.test(line.text) &&
		!runningTexts.has(line.text)
	);
};

const findSectionFontSize = (candidates: SizedLine[]): null | number => {
	const countBySize = new Map<number, number>();

	for (const { fontSize } of candidates) {
		countBySize.set(
			fontSize,
			(countBySize.get(fontSize) ?? NO_FONT_SIZE) + OCCURRENCE_STEP,
		);
	}

	const repeatedSizes: number[] = [];

	for (const [fontSize, count] of countBySize) {
		if (count > SINGLE_OCCURRENCE) {
			repeatedSizes.push(fontSize);
		}
	}

	repeatedSizes.sort((left, right) => right - left);

	return (
		repeatedSizes[
			Math.min(HeadingDetection.SECTION_LEVEL_COUNT, repeatedSizes.length) -
				LEVEL_OFFSET
		] ?? null
	);
};

const detectPdfHeadings = (pages: ParsedPageBlock[]): DocumentLine[] | null => {
	const lines = toSizedLines(pages);
	const bodySize = findBodyFontSize(lines);
	const runningTexts = findRunningTexts(lines);
	const candidates = lines.filter((line) =>
		isHeadingCandidate(line, bodySize, runningTexts),
	);
	const sectionSize = findSectionFontSize(candidates);

	if (
		sectionSize === null ||
		candidates.length < HeadingDetection.MINIMUM_HEADINGS
	) {
		return null;
	}

	const sectionSizes = [
		...new Set(
			candidates
				.map(({ fontSize }) => fontSize)
				.filter((fontSize) => fontSize >= sectionSize),
		),
	].toSorted((left, right) => right - left);

	return lines.map((line) => ({
		headingLevel:
			isHeadingCandidate(line, bodySize, runningTexts) &&
			line.fontSize >= sectionSize
				? sectionSizes.indexOf(line.fontSize) + LEVEL_OFFSET
				: null,
		pageNumber: line.pageNumber,
		text: line.text,
	}));
};

export { detectPdfHeadings };
