import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import { describe, it } from "node:test";

import {
	TextErrorMessage,
	UTF_8_BOM,
	UTF_16_BE_BOM,
	UTF_16_LE_BOM,
} from "../constants/text-document.constant.js";
import { DocumentParseFailedError } from "../exceptions/document-parse-failed.exception.js";
import { parseTextDocument } from "./parse-text-document.helper.js";

const EXPECTED_PAGE_NUMBER = 1;
const SINGLE_BLOCK_COUNT = 1;
const UTF16_PAIR_STEP = 2;
const UTF16_SECOND_BYTE_OFFSET = 1;
const HEX_ENCODING = "hex";
const UTF16_LE_ENCODING = "utf16le";

const createBytesFromHex = (hex: string): Uint8Array => {
	return new Uint8Array(Buffer.from(hex, HEX_ENCODING));
};

const createUtf16LeBytes = (text: string): Uint8Array => {
	return new Uint8Array(Buffer.from(text, UTF16_LE_ENCODING));
};

const createUtf16BeBytes = (text: string): Uint8Array => {
	const leBytes = Buffer.from(text, UTF16_LE_ENCODING);
	const beBytes = Buffer.alloc(leBytes.length);

	for (let index = 0; index < leBytes.length; index += UTF16_PAIR_STEP) {
		const highByte = leBytes[index + UTF16_SECOND_BYTE_OFFSET];
		const lowByte = leBytes[index];

		if (highByte !== undefined && lowByte !== undefined) {
			beBytes[index] = highByte;
			beBytes[index + UTF16_SECOND_BYTE_OFFSET] = lowByte;
		}
	}

	return new Uint8Array(beBytes);
};

const prependBytes = (
	prefix: readonly number[],
	payload: Uint8Array,
): Uint8Array => {
	const combined = new Uint8Array(prefix.length + payload.length);
	combined.set(prefix);
	combined.set(payload, prefix.length);

	return combined;
};

void describe("parseTextDocument", () => {
	void it("decodes valid UTF-8 text with no BOM", () => {
		const sourceText = "KnowledgePrism supports structured knowledge.";
		const bytes = new TextEncoder().encode(sourceText);

		const result = parseTextDocument(bytes);
		const [firstBlock] = result;

		assert.ok(firstBlock);
		assert.equal(result.length, SINGLE_BLOCK_COUNT);
		assert.equal(firstBlock.content, sourceText);
		assert.equal(firstBlock.pageNumber, EXPECTED_PAGE_NUMBER);
	});

	void it("decodes UTF-8 text with BOM and strips BOM from content", () => {
		const sourceText = "Text with BOM header.";
		const payload = new TextEncoder().encode(sourceText);
		const bytes = prependBytes(UTF_8_BOM, payload);

		const result = parseTextDocument(bytes);
		const [firstBlock] = result;

		assert.ok(firstBlock);
		assert.equal(firstBlock.content, sourceText);
		assert.equal(firstBlock.content.startsWith("\u{FEFF}"), false);
	});

	void it("decodes UTF-16 LE text with BOM and strips BOM from content", () => {
		const sourceText = "Architecture and design notes for KnowledgePrism.";
		const payload = createUtf16LeBytes(sourceText);
		const bytes = prependBytes(UTF_16_LE_BOM, payload);

		const result = parseTextDocument(bytes);
		const [firstBlock] = result;

		assert.ok(firstBlock);
		assert.equal(firstBlock.content, sourceText);
		assert.equal(firstBlock.content.startsWith("\u{FEFF}"), false);
	});

	void it("decodes UTF-16 BE text with BOM and strips BOM from content", () => {
		const sourceText = "Prism knowledge base extraction document.";
		const payload = createUtf16BeBytes(sourceText);
		const bytes = prependBytes(UTF_16_BE_BOM, payload);

		const result = parseTextDocument(bytes);
		const [firstBlock] = result;

		assert.ok(firstBlock);
		assert.equal(firstBlock.content, sourceText);
		assert.equal(firstBlock.content.startsWith("\u{FEFF}"), false);
	});

	void it("decodes UTF-16 LE text without BOM", () => {
		const sourceText = "Document in UTF-16 LE without BOM.\nSecond line.";
		const bytes = createUtf16LeBytes(sourceText);

		const result = parseTextDocument(bytes);
		const [firstBlock] = result;

		assert.ok(firstBlock);
		assert.equal(firstBlock.content, sourceText);
	});

	void it("decodes UTF-16 BE text without BOM", () => {
		const sourceText = "Document in UTF-16 BE without BOM.\nSecond line.";
		const bytes = createUtf16BeBytes(sourceText);

		const result = parseTextDocument(bytes);
		const [firstBlock] = result;

		assert.ok(firstBlock);
		assert.equal(firstBlock.content, sourceText);
	});

	void it("decodes Windows-1252 Western European text with accented letters and symbols", () => {
		const frenchBytes = createBytesFromHex(
			"432765737420756e206578656d706c6520e0206c27e974e92e",
		);

		const result = parseTextDocument(frenchBytes);
		const [firstBlock] = result;

		assert.ok(firstBlock);
		assert.equal(firstBlock.content, "C'est un exemple à l'été.");
	});

	void it("decodes Windows-1252 text with smart quotes, dashes, and euro symbol", () => {
		const symbolBytes = createBytesFromHex(
			"9348656c6c6f9420972050726963653a203135208085",
		);

		const result = parseTextDocument(symbolBytes);
		const [firstBlock] = result;

		assert.ok(firstBlock);
		assert.equal(firstBlock.content, "“Hello” — Price: 15 €…");
	});

	void it("decodes Windows-1251 Cyrillic text", () => {
		const cyrillicBytes = createBytesFromHex(
			"cff0ee20e7e0f2e2e5f0e4e6e5ededff20efeef0ffe4eaf3",
		);

		const result = parseTextDocument(cyrillicBytes);
		const [firstBlock] = result;

		assert.ok(firstBlock);
		assert.equal(firstBlock.content, "Про затвердження порядку");
	});

	void it("decodes Windows-1250 Central European text", () => {
		const polishBytes = createBytesFromHex(
			"5a61bff3b3e62067ea9c6cb9206a619ff1",
		);

		const result = parseTextDocument(polishBytes);
		const [firstBlock] = result;

		assert.ok(firstBlock);
		assert.equal(firstBlock.content, "Zażółć gęślą jaźń");
	});

	void it("normalizes CRLF and CR line endings to LF", () => {
		const sourceText = "Line one\r\nLine two\rLine three\nLine four";
		const bytes = new TextEncoder().encode(sourceText);

		const result = parseTextDocument(bytes);
		const [firstBlock] = result;

		assert.ok(firstBlock);
		assert.equal(
			firstBlock.content,
			"Line one\nLine two\nLine three\nLine four",
		);
	});

	void it("normalizes Unicode content to NFC form", () => {
		const decomposed = "e\u{0301}";
		const bytes = new TextEncoder().encode(decomposed);

		const result = parseTextDocument(bytes);
		const [firstBlock] = result;

		assert.ok(firstBlock);
		assert.equal(firstBlock.content, "é");
	});

	void it("handles empty byte array", () => {
		const result = parseTextDocument(new Uint8Array([]));

		assert.deepEqual(result, [
			{ content: "", pageNumber: EXPECTED_PAGE_NUMBER },
		]);
	});

	void it("rejects binary files containing null bytes with binary error", () => {
		const binaryBytes = createBytesFromHex("48656c6c006f");

		assert.throws(
			() => {
				parseTextDocument(binaryBytes);
			},
			(error: unknown) => {
				return (
					error instanceof DocumentParseFailedError &&
					error.message === TextErrorMessage.BINARY_DATA
				);
			},
		);
	});

	void it("rejects binary files containing control characters with binary error", () => {
		const binaryControlBytes = createBytesFromHex("4865016c6f");

		assert.throws(
			() => {
				parseTextDocument(binaryControlBytes);
			},
			(error: unknown) => {
				return (
					error instanceof DocumentParseFailedError &&
					error.message === TextErrorMessage.BINARY_DATA
				);
			},
		);
	});

	void it("rejects undecodable or unsupported text encodings with clear error", () => {
		const unsupportedBytes = createBytesFromHex("8190a5fe8d989dbb");

		assert.throws(
			() => {
				parseTextDocument(unsupportedBytes);
			},
			(error: unknown) => {
				return (
					error instanceof DocumentParseFailedError &&
					error.message === TextErrorMessage.UNSUPPORTED_ENCODING
				);
			},
		);
	});

	void it("rejects odd length UTF-16 files with unsupported encoding error", () => {
		const oddUtf16Bytes = createBytesFromHex("fffe41");

		assert.throws(
			() => {
				parseTextDocument(oddUtf16Bytes);
			},
			(error: unknown) => {
				return (
					error instanceof DocumentParseFailedError &&
					error.message === TextErrorMessage.UNSUPPORTED_ENCODING
				);
			},
		);
	});
});
