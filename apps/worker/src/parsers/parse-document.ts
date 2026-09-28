import { DocumentContentType } from "@knowledgeprism/constants";

import { UnsupportedDocumentFormatError } from "./libs/exceptions/unsupported-document-format.exception.js";
import { parsePdfPages } from "./libs/helpers/parse-pdf-pages.helper.js";
import { parseTextDocument } from "./libs/helpers/parse-text-document.helper.js";
import { type ParsedPageBlock } from "./libs/types/parsed-page-block.type.js";

type ParseDocumentPayload = {
	bytes: Uint8Array;
	contentType: string;
};

const parseDocument = async ({
	bytes,
	contentType,
}: ParseDocumentPayload): Promise<ParsedPageBlock[]> => {
	if (contentType === DocumentContentType.PDF) {
		return await parsePdfPages(bytes);
	}

	if (contentType === DocumentContentType.TXT) {
		return parseTextDocument(bytes);
	}

	throw new UnsupportedDocumentFormatError({ contentType });
};

export { parseDocument };
