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
	switch (contentType) {
		case DocumentContentType.PDF: {
			return parsePdfPages(bytes);
		}
		default: {
			throw new UnsupportedDocumentFormatError({ contentType });
		}
	}
};

export { parseDocument };
