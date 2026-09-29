const SENTENCE_BOUNDARY = /(?<=[!.?])\s+|\n{2,}/u;
const EMPTY_LENGTH = 0;

const splitIntoSentences = (content: string): string[] => {
	return content
		.split(SENTENCE_BOUNDARY)
		.map((sentence) => sentence.trim())
		.filter((sentence) => sentence.length > EMPTY_LENGTH);
};

export { splitIntoSentences };
