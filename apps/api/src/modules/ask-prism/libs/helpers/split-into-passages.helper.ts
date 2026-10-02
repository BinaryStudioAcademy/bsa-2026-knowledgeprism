import { PassageLimit } from "../constants/passage-limit.constant.js";

const SENTENCE_SEGMENTER = new Intl.Segmenter("en", {
	granularity: "sentence",
});

const toPassageText = (title: string, text: string): string => {
	return title ? `${title}\n${text}` : text;
};

const splitIntoPassages = (title: string, text: string): string[] => {
	if (text.length <= PassageLimit.MAXIMUM_LENGTH) {
		return [toPassageText(title, text)];
	}

	const passages: string[] = [];
	let current = "";

	for (const { segment } of SENTENCE_SEGMENTER.segment(text)) {
		if (
			current !== "" &&
			current.length + segment.length > PassageLimit.MAXIMUM_LENGTH
		) {
			passages.push(toPassageText(title, current.trim()));
			current = "";
		}

		current += segment;
	}

	if (current.trim() !== "") {
		passages.push(toPassageText(title, current.trim()));
	}

	return passages;
};

export { splitIntoPassages };
