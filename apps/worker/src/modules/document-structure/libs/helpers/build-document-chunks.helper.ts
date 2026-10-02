import { splitIntoChunks } from "~/modules/knowledge-extraction/libs/helpers/split-into-chunks.helper.js";
import { type PageStart } from "~/modules/knowledge-extraction/libs/types/page-start.type.js";
import { type ParsedPageBlock } from "~/parsers/libs/types/parsed-page-block.type.js";

import {
	MARKDOWN_HEADING,
	MINIMUM_PREAMBLE_LENGTH,
} from "../constants/document-structure.constant.js";
import { type DocumentChunk, type DocumentLine } from "../types/types.js";
import { detectPdfHeadings } from "./detect-pdf-headings.helper.js";
import { detectTextHeadings } from "./detect-text-headings.helper.js";

type Section = {
	lines: DocumentLine[];
	title: null | string;
};

type UnpositionedChunk = Omit<DocumentChunk, "position">;

const FIRST_INDEX = 0;
const LAST_CHARACTER_OFFSET = 1;
const LAST_ITEM_INDEX = -1;
const LINE_JOINER = "\n";
const MARKDOWN_TITLE_GROUP = 2;
const NOT_FOUND_INDEX = -1;

const toHeadingTitle = (text: string): string => {
	const trimmed = text.trim();

	return MARKDOWN_HEADING.exec(trimmed)?.[MARKDOWN_TITLE_GROUP] ?? trimmed;
};

const hasBody = (section: Section): boolean => {
	return section.lines.some(
		({ headingLevel, text }) => headingLevel === null && text.trim() !== "",
	);
};

const toBodyLength = (section: Section): number => {
	return section.lines
		.filter(({ headingLevel }) => headingLevel === null)
		.reduce((length, { text }) => length + text.trim().length, FIRST_INDEX);
};

const foldShortPreamble = (sections: Section[]): Section[] => {
	const [preamble, next, ...rest] = sections;

	if (
		!preamble ||
		!next ||
		preamble.title !== null ||
		toBodyLength(preamble) >= MINIMUM_PREAMBLE_LENGTH
	) {
		return sections;
	}

	return [
		{ lines: [...preamble.lines, ...next.lines], title: next.title },
		...rest,
	];
};

const toSections = (lines: DocumentLine[]): Section[] => {
	const sections: Section[] = [];
	let current: Section = { lines: [], title: null };

	for (const line of lines) {
		if (line.headingLevel === null) {
			current.lines.push(line);
			continue;
		}

		sections.push(current);
		current = { lines: [line], title: toHeadingTitle(line.text) };
	}

	sections.push(current);

	return foldShortPreamble(sections.filter((section) => hasBody(section)));
};

const findPageAt = (starts: PageStart[], offset: number): number => {
	return (
		starts.findLast((start) => start.offset <= offset)?.pageNumber ??
		starts[FIRST_INDEX]?.pageNumber ??
		FIRST_INDEX
	);
};

const toPartPageStarts = (
	starts: PageStart[],
	{
		end,
		offset,
		pageNumber,
	}: { end: number; offset: number; pageNumber: number },
): PageStart[] => {
	const partStarts: PageStart[] = [{ offset: FIRST_INDEX, pageNumber }];

	for (const start of starts) {
		const previous = partStarts.at(LAST_ITEM_INDEX);

		if (
			start.offset > offset &&
			start.offset < end &&
			start.pageNumber !== previous?.pageNumber
		) {
			partStarts.push({
				offset: start.offset - offset,
				pageNumber: start.pageNumber,
			});
		}
	}

	return partStarts;
};

const toSectionChunks = (
	section: Section,
	sectionIndex: number,
): UnpositionedChunk[] => {
	const starts: PageStart[] = [];
	let content = "";

	for (const { pageNumber, text } of section.lines) {
		if (content !== "") {
			content += LINE_JOINER;
		}

		starts.push({ offset: content.length, pageNumber });
		content += text;
	}

	let searchFrom = FIRST_INDEX;

	return splitIntoChunks(content).map((part, partIndex) => {
		const foundAt = content.indexOf(part, searchFrom);
		const offset = foundAt === NOT_FOUND_INDEX ? searchFrom : foundAt;
		searchFrom = offset + part.length;

		const pageNumber = findPageAt(starts, offset);

		return {
			content: part,
			pageEnd: findPageAt(starts, offset + part.length - LAST_CHARACTER_OFFSET),
			pageNumber,
			pageStarts: toPartPageStarts(starts, {
				end: offset + part.length,
				offset,
				pageNumber,
			}),
			part: partIndex,
			sectionIndex,
			sectionTitle: section.title,
		};
	});
};

const toPageChunks = (pages: ParsedPageBlock[]): UnpositionedChunk[] => {
	return pages.flatMap(({ content, pageNumber }) =>
		splitIntoChunks(content).map((part, partIndex) => ({
			content: part,
			pageEnd: pageNumber,
			pageNumber,
			pageStarts: [{ offset: FIRST_INDEX, pageNumber }],
			part: partIndex,
			sectionIndex: null,
			sectionTitle: null,
		})),
	);
};

const buildDocumentChunks = (pages: ParsedPageBlock[]): DocumentChunk[] => {
	const lines = detectPdfHeadings(pages) ?? detectTextHeadings(pages);
	const chunks = lines
		? toSections(lines).flatMap((section, sectionIndex) =>
				toSectionChunks(section, sectionIndex),
			)
		: toPageChunks(pages);

	return chunks.map((chunk, position) => ({ ...chunk, position }));
};

export { buildDocumentChunks };
