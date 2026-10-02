import { type ParsedPageBlock } from "~/parsers/libs/types/parsed-page-block.type.js";

import { applyTranslatedSectionTitles } from "../libs/helpers/apply-translated-section-titles.helper.js";
import { buildDocumentChunks } from "../libs/helpers/build-document-chunks.helper.js";
import { type DocumentChunk } from "../libs/types/types.js";

const toDocumentChunks = (pages: ParsedPageBlock[]): DocumentChunk[] => {
	return buildDocumentChunks(pages);
};

const withTranslatedSectionTitles = (
	originals: DocumentChunk[],
	translated: DocumentChunk[],
): DocumentChunk[] => {
	return applyTranslatedSectionTitles(originals, translated);
};

export { toDocumentChunks, withTranslatedSectionTitles };
