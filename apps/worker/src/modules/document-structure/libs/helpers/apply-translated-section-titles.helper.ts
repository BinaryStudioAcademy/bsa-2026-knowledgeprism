import {
	HeadingDetection,
	MARKDOWN_HEADING,
} from "../constants/document-structure.constant.js";
import { type DocumentChunk } from "../types/types.js";

const FIRST_INDEX = 0;
const FIRST_PART = 0;
const LINE_BREAK = /\r?\n/u;
const MARKDOWN_TITLE_GROUP = 2;

const readFirstLineTitle = (content: string): string => {
	const [firstLine = ""] = content.split(LINE_BREAK);
	const trimmed = firstLine.trim();

	return (
		MARKDOWN_HEADING.exec(trimmed)?.[MARKDOWN_TITLE_GROUP] ?? trimmed
	).slice(FIRST_INDEX, HeadingDetection.MAXIMUM_LENGTH);
};

const readTranslatedTitle = (
	original: DocumentChunk,
	translated: DocumentChunk | undefined,
): null | string => {
	if (
		!translated ||
		original.sectionIndex === null ||
		original.sectionTitle === null ||
		original.part !== FIRST_PART ||
		original.content === translated.content ||
		readFirstLineTitle(original.content) !== original.sectionTitle
	) {
		return null;
	}

	const title = readFirstLineTitle(translated.content);

	return title === "" ? null : title;
};

const applyTranslatedSectionTitles = (
	originals: DocumentChunk[],
	translated: DocumentChunk[],
): DocumentChunk[] => {
	const titles = new Map<number, string>();

	for (const [index, original] of originals.entries()) {
		const title = readTranslatedTitle(original, translated[index]);

		if (title !== null && original.sectionIndex !== null) {
			titles.set(original.sectionIndex, title);
		}
	}

	return translated.map((chunk, index) => {
		const title =
			chunk.sectionIndex === null ? undefined : titles.get(chunk.sectionIndex);
		const original = originals[index];
		const isTranslated =
			original !== undefined && chunk.content !== original.content;

		return {
			...chunk,
			...(isTranslated && { originalPageStarts: original.pageStarts }),
			pageStarts: isTranslated
				? [{ offset: FIRST_INDEX, pageNumber: chunk.pageNumber }]
				: chunk.pageStarts,
			sectionTitle: title ?? chunk.sectionTitle,
		};
	});
};

export { applyTranslatedSectionTitles };
