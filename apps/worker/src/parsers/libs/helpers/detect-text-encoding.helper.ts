import {
	CharacterCode,
	TextEncoding,
	UTF_8_BOM,
	UTF_16_BE_BOM,
	UTF_16_LE_BOM,
	WINDOWS_1250_UNDEFINED_BYTES,
	WINDOWS_1251_UNDEFINED_BYTES,
	WINDOWS_1252_UNDEFINED_BYTES,
} from "../constants/text-document.constant.js";

const EMPTY_COUNT = 0;
const FIRST_CHARACTER_INDEX = 0;
const INCREMENT_STEP = 1;
const MINIMUM_UTF16_BYTE_LENGTH = 4;
const UTF16_SAMPLE_LIMIT_BYTES = 1024;
const UTF16_PAIR_STEP = 2;
const UTF16_PAIR_SECOND_BYTE_OFFSET = 1;
const UTF16_MATCH_RATIO_THRESHOLD = 0.6;
const UTF16_CYRILLIC_PAGE_BYTE = 4;
const ASCII_PRINTABLE_MIN = 32;
const ASCII_PRINTABLE_MAX = 126;

const MINIMUM_CYRILLIC_LETTERS_COUNT = 2;
const MINIMUM_CENTRAL_EUROPEAN_LETTERS_COUNT = 2;
const MINIMUM_CENTRAL_EUROPEAN_WORD_LENGTH = 2;
const MAXIMUM_SHORT_ACCENTED_WORD_COUNT = 2;
const SINGLE_ACCENTED_WORD_LENGTH = 1;

const CYRILLIC_WORD_PATTERN = /[\u{0400}-\u{04FF}]{2,}/gu;
const CYRILLIC_LETTER_PATTERN = /[\u{0400}-\u{04FF}]/gu;
const MIXED_LATIN_CYRILLIC_PATTERN =
	/[a-z][\u{0400}-\u{04FF}]|[\u{0400}-\u{04FF}][a-z]/iu;

const CENTRAL_EUROPEAN_LETTER_PATTERN = /[\u{0100}-\u{024F}]/gu;
const CENTRAL_EUROPEAN_WORD_PATTERN = /[a-z\u{00C0}-\u{024F}]+/giu;

const LATIN_WORD_PATTERN = /[a-z\u{00C0}-\u{00FF}]+/giu;
const ACCENTED_LATIN_PATTERN = /[\u{00C0}-\u{00FF}]/gu;
const ASCII_LETTER_PATTERN = /[a-z]/giu;
const WINDOWS_1252_SYMBOL_PATTERN =
	/[\u{2018}\u{2019}\u{201C}\u{201D}\u{2013}\u{2014}\u{2026}\u{20AC}]/gu;

const WHITESPACE_BYTES: ReadonlySet<number> = new Set([
	CharacterCode.CARRIAGE_RETURN,
	CharacterCode.LINE_FEED,
	CharacterCode.TAB,
]);

type DetectedEncoding = {
	encoding: string;
	stripBomBytes: number;
};

const hasMatchingBom = (bytes: Uint8Array, bom: readonly number[]): boolean => {
	if (bytes.length < bom.length) {
		return false;
	}

	return bom.every((byte, index) => {
		const currentByte = bytes[index];

		return currentByte !== undefined && currentByte === byte;
	});
};

const isControlByte = (byte: number): boolean => {
	const isNonWhitespaceControl =
		byte < CharacterCode.SPACE &&
		byte !== CharacterCode.TAB &&
		byte !== CharacterCode.LINE_FEED &&
		byte !== CharacterCode.CARRIAGE_RETURN &&
		byte !== CharacterCode.FORM_FEED;

	return isNonWhitespaceControl || byte === CharacterCode.DEL;
};

const hasBinaryControlBytes = (bytes: Uint8Array): boolean => {
	for (const byte of bytes) {
		if (byte === CharacterCode.NULL || isControlByte(byte)) {
			return true;
		}
	}

	return false;
};

const hasBinaryCharacters = (text: string): boolean => {
	for (const char of text) {
		const code = char.codePointAt(FIRST_CHARACTER_INDEX) ?? CharacterCode.NULL;

		const isNonWhitespaceCode =
			code < CharacterCode.SPACE &&
			code !== CharacterCode.TAB &&
			code !== CharacterCode.LINE_FEED &&
			code !== CharacterCode.CARRIAGE_RETURN &&
			code !== CharacterCode.FORM_FEED;

		if (
			isNonWhitespaceCode ||
			code === CharacterCode.NULL ||
			code === CharacterCode.DEL
		) {
			return true;
		}
	}

	return false;
};

const isPrintableAsciiOrWhitespace = (byte: number): boolean => {
	const isPrintable =
		byte >= ASCII_PRINTABLE_MIN && byte <= ASCII_PRINTABLE_MAX;
	const isWhitespace = WHITESPACE_BYTES.has(byte);

	return isPrintable || isWhitespace;
};

const detectUtf16WithoutBom = (bytes: Uint8Array): null | string => {
	if (
		bytes.length < MINIMUM_UTF16_BYTE_LENGTH ||
		bytes.length % UTF16_PAIR_STEP !== EMPTY_COUNT
	) {
		return null;
	}

	const sampleLimit = Math.min(bytes.length, UTF16_SAMPLE_LIMIT_BYTES);
	const pairCount = sampleLimit / UTF16_PAIR_STEP;
	let leMatches = 0;
	let beMatches = 0;

	for (let index = 0; index < sampleLimit; index += UTF16_PAIR_STEP) {
		const firstByte = bytes[index];
		const secondByte = bytes[index + UTF16_PAIR_SECOND_BYTE_OFFSET];

		if (firstByte === undefined || secondByte === undefined) {
			continue;
		}

		const isLeAscii =
			secondByte === CharacterCode.NULL &&
			isPrintableAsciiOrWhitespace(firstByte);
		const isLeCyrillic = secondByte === UTF16_CYRILLIC_PAGE_BYTE;

		if (isLeAscii || isLeCyrillic) {
			leMatches += INCREMENT_STEP;
		}

		const isBeAscii =
			firstByte === CharacterCode.NULL &&
			isPrintableAsciiOrWhitespace(secondByte);
		const isBeCyrillic = firstByte === UTF16_CYRILLIC_PAGE_BYTE;

		if (isBeAscii || isBeCyrillic) {
			beMatches += INCREMENT_STEP;
		}
	}

	if (
		leMatches > beMatches &&
		leMatches / pairCount >= UTF16_MATCH_RATIO_THRESHOLD
	) {
		return TextEncoding.UTF_16_LE;
	}

	if (
		beMatches > leMatches &&
		beMatches / pairCount >= UTF16_MATCH_RATIO_THRESHOLD
	) {
		return TextEncoding.UTF_16_BE;
	}

	return null;
};

const hasUndefinedBytes = (
	bytes: Uint8Array,
	undefinedBytes: Set<number>,
): boolean => {
	for (const byte of bytes) {
		if (undefinedBytes.has(byte)) {
			return true;
		}
	}

	return false;
};

const isRealisticLatinWord = (word: string): boolean => {
	const accentedLettersCount = (word.match(ACCENTED_LATIN_PATTERN) ?? [])
		.length;

	if (accentedLettersCount === EMPTY_COUNT) {
		return true;
	}

	const asciiLettersCount = (word.match(ASCII_LETTER_PATTERN) ?? []).length;

	if (asciiLettersCount >= accentedLettersCount) {
		return true;
	}

	if (
		accentedLettersCount <= MAXIMUM_SHORT_ACCENTED_WORD_COUNT &&
		asciiLettersCount > EMPTY_COUNT
	) {
		return true;
	}

	return (
		accentedLettersCount === SINGLE_ACCENTED_WORD_LENGTH &&
		asciiLettersCount === EMPTY_COUNT
	);
};

const isWindows1251 = (bytes: Uint8Array): boolean => {
	if (hasUndefinedBytes(bytes, WINDOWS_1251_UNDEFINED_BYTES)) {
		return false;
	}

	const decodedText = new TextDecoder(TextEncoding.WINDOWS_1251).decode(bytes);
	const cyrillicLetters = (decodedText.match(CYRILLIC_LETTER_PATTERN) ?? [])
		.length;
	const cyrillicWords = (decodedText.match(CYRILLIC_WORD_PATTERN) ?? []).length;
	const hasMixedLatinCyrillic = MIXED_LATIN_CYRILLIC_PATTERN.test(decodedText);

	return (
		cyrillicWords > EMPTY_COUNT &&
		!hasMixedLatinCyrillic &&
		cyrillicLetters >= MINIMUM_CYRILLIC_LETTERS_COUNT
	);
};

const isWindows1250 = (bytes: Uint8Array): boolean => {
	if (hasUndefinedBytes(bytes, WINDOWS_1250_UNDEFINED_BYTES)) {
		return false;
	}

	const decodedText = new TextDecoder(TextEncoding.WINDOWS_1250).decode(bytes);
	const ceLetters = (decodedText.match(CENTRAL_EUROPEAN_LETTER_PATTERN) ?? [])
		.length;

	if (ceLetters < MINIMUM_CENTRAL_EUROPEAN_LETTERS_COUNT) {
		return false;
	}

	const allWords = decodedText.match(CENTRAL_EUROPEAN_WORD_PATTERN) ?? [];
	let realisticWordsCount = 0;
	let unrealisticWordsCount = 0;

	for (const word of allWords) {
		const ceCount = (word.match(CENTRAL_EUROPEAN_LETTER_PATTERN) ?? []).length;

		if (ceCount > EMPTY_COUNT) {
			if (word.length >= MINIMUM_CENTRAL_EUROPEAN_WORD_LENGTH) {
				realisticWordsCount += INCREMENT_STEP;
			} else {
				unrealisticWordsCount += INCREMENT_STEP;
			}
		}
	}

	return (
		unrealisticWordsCount === EMPTY_COUNT && realisticWordsCount > EMPTY_COUNT
	);
};

const isWindows1252 = (bytes: Uint8Array): boolean => {
	if (hasUndefinedBytes(bytes, WINDOWS_1252_UNDEFINED_BYTES)) {
		return false;
	}

	const decodedText = new TextDecoder(TextEncoding.WINDOWS_1252).decode(bytes);
	const allWords = decodedText.match(LATIN_WORD_PATTERN) ?? [];
	let realisticCount = 0;
	let unrealisticCount = 0;

	for (const word of allWords) {
		const accentedCount = (word.match(ACCENTED_LATIN_PATTERN) ?? []).length;

		if (accentedCount > EMPTY_COUNT) {
			if (isRealisticLatinWord(word)) {
				realisticCount += INCREMENT_STEP;
			} else {
				unrealisticCount += INCREMENT_STEP;
			}
		}
	}

	const symbolMatches = (decodedText.match(WINDOWS_1252_SYMBOL_PATTERN) ?? [])
		.length;

	return (
		unrealisticCount === EMPTY_COUNT &&
		(realisticCount > EMPTY_COUNT || symbolMatches > EMPTY_COUNT)
	);
};

const detectAnsiEncoding = (bytes: Uint8Array): null | string => {
	if (isWindows1251(bytes)) {
		return TextEncoding.WINDOWS_1251;
	}

	if (isWindows1250(bytes)) {
		return TextEncoding.WINDOWS_1250;
	}

	if (isWindows1252(bytes)) {
		return TextEncoding.WINDOWS_1252;
	}

	return null;
};

const detectTextEncoding = (bytes: Uint8Array): DetectedEncoding | null => {
	if (hasMatchingBom(bytes, UTF_8_BOM)) {
		return { encoding: TextEncoding.UTF_8, stripBomBytes: UTF_8_BOM.length };
	}

	if (hasMatchingBom(bytes, UTF_16_LE_BOM)) {
		return {
			encoding: TextEncoding.UTF_16_LE,
			stripBomBytes: UTF_16_LE_BOM.length,
		};
	}

	if (hasMatchingBom(bytes, UTF_16_BE_BOM)) {
		return {
			encoding: TextEncoding.UTF_16_BE,
			stripBomBytes: UTF_16_BE_BOM.length,
		};
	}

	const detectedUtf16 = detectUtf16WithoutBom(bytes);

	if (detectedUtf16) {
		return { encoding: detectedUtf16, stripBomBytes: EMPTY_COUNT };
	}

	return null;
};

export {
	detectAnsiEncoding,
	detectTextEncoding,
	hasBinaryCharacters,
	hasBinaryControlBytes,
};
