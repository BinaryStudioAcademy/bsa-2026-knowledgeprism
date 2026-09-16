import { DocumentContentType } from "./libs/enums/document-content-type.enum.js";
import { UnsupportedDocumentFormatError } from "./libs/exceptions/unsupported-document-format.exception.js";
import { parsePdfPages } from "./libs/helpers/parse-pdf-pages.helper.js";
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

	throw new UnsupportedDocumentFormatError({ contentType });
};

export { parseDocument };
