import {
	ENGLISH_STOP_WORDS,
	EnglishDetection,
} from "../constants/english-detection.constant.js";

const LATIN_LETTER = /[a-z]/iu;
const LETTER = /\p{L}/gu;
const WORD = /\p{L}+/gu;
const NO_LETTERS = 0;

const isEnglishText = (text: string): boolean => {
	const letters = text.match(LETTER) ?? [];

	if (letters.length === NO_LETTERS) {
		return true;
	}

	const latinRatio =
		letters.filter((letter) => LATIN_LETTER.test(letter)).length /
		letters.length;

	if (latinRatio < EnglishDetection.MINIMUM_LATIN_RATIO) {
		return false;
	}

	const words = (text.toLowerCase().match(WORD) ?? []).filter(Boolean);

	if (words.length < EnglishDetection.MINIMUM_WORDS_FOR_STOP_WORDS) {
		return true;
	}

	const stopWords = words.filter((word) => ENGLISH_STOP_WORDS.has(word));

	return (
		stopWords.length / words.length >= EnglishDetection.MINIMUM_STOP_WORD_RATIO
	);
};

export { isEnglishText };
