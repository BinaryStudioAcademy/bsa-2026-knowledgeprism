import { DocumentParseFailedError } from "../exceptions/document-parse-failed.exception.js";
import { type ParsedPageBlock } from "../types/parsed-page-block.type.js";

const TEXT_DOCUMENT_ENCODING = "utf8";
const TEXT_DOCUMENT_PAGE_NUMBER = 1;
const NULL_CHARACTER = "\u{0}";

const decodeUtf8 = (bytes: Uint8Array): string => {
	try {
		return new TextDecoder(TEXT_DOCUMENT_ENCODING, { fatal: true }).decode(
			bytes,
		);
	} catch (error) {
		throw new DocumentParseFailedError({
			cause: error,
			message: "Text document is not valid UTF-8.",
		});
	}
};

const parseTextDocument = (bytes: Uint8Array): ParsedPageBlock[] => {
	const content = decodeUtf8(bytes);

	if (content.includes(NULL_CHARACTER)) {
		throw new DocumentParseFailedError({
			message: "Text document contains binary data.",
		});
	}

	return [{ content, pageNumber: TEXT_DOCUMENT_PAGE_NUMBER }];
};

export { parseTextDocument };
