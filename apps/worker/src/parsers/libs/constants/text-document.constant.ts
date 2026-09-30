const TEXT_DOCUMENT_PAGE_NUMBER = 1;

const TextEncoding = {
	UTF_8: "utf8",
	UTF_16_BE: "utf-16be",
	UTF_16_LE: "utf-16le",
	WINDOWS_1250: "windows-1250",
	WINDOWS_1251: "windows-1251",
	WINDOWS_1252: "windows-1252",
} as const;

const TextErrorMessage = {
	BINARY_DATA: "Text document contains binary data.",
	UNSUPPORTED_ENCODING:
		"Text document has an unsupported or unrecognized character encoding.",
} as const;

const BomByte = {
	BYTE_BB: 187,
	BYTE_BF: 191,
	BYTE_EF: 239,
	BYTE_FE: 254,
	BYTE_FF: 255,
} as const;

const UTF_8_BOM = [BomByte.BYTE_EF, BomByte.BYTE_BB, BomByte.BYTE_BF] as const;
const UTF_16_LE_BOM = [BomByte.BYTE_FF, BomByte.BYTE_FE] as const;
const UTF_16_BE_BOM = [BomByte.BYTE_FE, BomByte.BYTE_FF] as const;

const CharacterByte = {
	CARRIAGE_RETURN: 13,
	DEL: 127,
	FORM_FEED: 12,
	LINE_FEED: 10,
	NULL: 0,
	SPACE: 32,
	TAB: 9,
} as const;

const CharacterCode = {
	CARRIAGE_RETURN: 13,
	DEL: 127,
	FORM_FEED: 12,
	LINE_FEED: 10,
	NULL: 0,
	SPACE: 32,
	TAB: 9,
} as const;

const BOM_CHARACTER = "\u{FEFF}";
const CARRIAGE_RETURN_CHARACTER = "\r";
const CARRIAGE_RETURN_NEWLINE_CHARACTER = "\r\n";

const UNICODE_NORMALIZATION_FORM = "NFC";

const Windows1252UndefinedByte = {
	BYTE_8D: 141,
	BYTE_8F: 143,
	BYTE_9D: 157,
	BYTE_81: 129,
	BYTE_90: 144,
} as const;

const Windows1251UndefinedByte = {
	BYTE_98: 152,
} as const;

const Windows1250UndefinedByte = {
	BYTE_81: 129,
	BYTE_83: 131,
	BYTE_88: 136,
	BYTE_90: 144,
	BYTE_98: 152,
} as const;

const WINDOWS_1252_UNDEFINED_BYTES = new Set<number>(
	Object.values(Windows1252UndefinedByte),
);

const WINDOWS_1251_UNDEFINED_BYTES = new Set<number>(
	Object.values(Windows1251UndefinedByte),
);

const WINDOWS_1250_UNDEFINED_BYTES = new Set<number>(
	Object.values(Windows1250UndefinedByte),
);

export {
	BOM_CHARACTER,
	CARRIAGE_RETURN_CHARACTER,
	CARRIAGE_RETURN_NEWLINE_CHARACTER,
	CharacterByte,
	CharacterCode,
	TEXT_DOCUMENT_PAGE_NUMBER,
	TextEncoding,
	TextErrorMessage,
	UNICODE_NORMALIZATION_FORM,
	UTF_16_BE_BOM,
	UTF_16_LE_BOM,
	UTF_8_BOM,
	WINDOWS_1250_UNDEFINED_BYTES,
	WINDOWS_1251_UNDEFINED_BYTES,
	WINDOWS_1252_UNDEFINED_BYTES,
};
