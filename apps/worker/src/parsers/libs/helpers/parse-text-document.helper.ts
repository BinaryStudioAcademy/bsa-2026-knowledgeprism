import {
	TEXT_DOCUMENT_PAGE_NUMBER,
	TextEncoding,
	TextErrorMessage,
} from "../constants/text-document.constant.js";
import { DocumentParseFailedError } from "../exceptions/document-parse-failed.exception.js";
import { type ParsedPageBlock } from "../types/parsed-page-block.type.js";
import {
	detectAnsiEncoding,
	detectTextEncoding,
	hasBinaryCharacters,
	hasBinaryControlBytes,
} from "./detect-text-encoding.helper.js";
import { normalizeTextContent } from "./normalize-text-content.helper.js";

const EMPTY_COUNT = 0;
const UTF16_BYTE_ALIGNMENT = 2;

const decodeWithEncoding = (bytes: Uint8Array, encoding: string): string => {
	try {
		return new TextDecoder(encoding, { fatal: true }).decode(bytes);
	} catch (error) {
		throw new DocumentParseFailedError({
			cause: error,
			message: TextErrorMessage.UNSUPPORTED_ENCODING,
		});
	}
};

const decodeUtf16OrBomDocument = (
	bytes: Uint8Array,
	detected: { encoding: string; stripBomBytes: number },
): string => {
	const payload = bytes.subarray(detected.stripBomBytes);

	const isUtf16 =
		detected.encoding === TextEncoding.UTF_16_LE ||
		detected.encoding === TextEncoding.UTF_16_BE;

	if (isUtf16 && payload.length % UTF16_BYTE_ALIGNMENT !== EMPTY_COUNT) {
		throw new DocumentParseFailedError({
			message: TextErrorMessage.UNSUPPORTED_ENCODING,
		});
	}

	const decoded = decodeWithEncoding(payload, detected.encoding);

	if (hasBinaryCharacters(decoded)) {
		throw new DocumentParseFailedError({
			message: TextErrorMessage.BINARY_DATA,
		});
	}

	return decoded;
};

const decodeRawTextDocument = (bytes: Uint8Array): string => {
	if (hasBinaryControlBytes(bytes)) {
		throw new DocumentParseFailedError({
			message: TextErrorMessage.BINARY_DATA,
		});
	}

	try {
		const decoded = new TextDecoder(TextEncoding.UTF_8, {
			fatal: true,
		}).decode(bytes);

		if (hasBinaryCharacters(decoded)) {
			throw new DocumentParseFailedError({
				message: TextErrorMessage.BINARY_DATA,
			});
		}

		return decoded;
	} catch (error) {
		if (error instanceof DocumentParseFailedError) {
			throw error;
		}
	}

	const ansiEncoding = detectAnsiEncoding(bytes);

	if (!ansiEncoding) {
		throw new DocumentParseFailedError({
			message: TextErrorMessage.UNSUPPORTED_ENCODING,
		});
	}

	const decoded = decodeWithEncoding(bytes, ansiEncoding);

	if (hasBinaryCharacters(decoded)) {
		throw new DocumentParseFailedError({
			message: TextErrorMessage.BINARY_DATA,
		});
	}

	return decoded;
};

const parseTextDocument = (bytes: Uint8Array): ParsedPageBlock[] => {
	if (bytes.length === EMPTY_COUNT) {
		return [{ content: "", pageNumber: TEXT_DOCUMENT_PAGE_NUMBER }];
	}

	const detected = detectTextEncoding(bytes);

	const decoded = detected
		? decodeUtf16OrBomDocument(bytes, detected)
		: decodeRawTextDocument(bytes);

	const content = normalizeTextContent(decoded);

	return [{ content, pageNumber: TEXT_DOCUMENT_PAGE_NUMBER }];
};

export { parseTextDocument };
