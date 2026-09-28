// A lightweight sentence/paragraph splitter, not full NLP: content is short enough (a
// glossary check runs on one document or one proposed page, not a whole knowledge base)
// that splitting on sentence-ending punctuation and blank lines is enough to keep each
// embedded chunk specific, instead of diluting it by embedding the whole content as one
// vector (a single unrelated sentence elsewhere in the content pulls the score down).
const SENTENCE_BOUNDARY = /(?<=[!.?])\s+|\n{2,}/u;
const EMPTY_LENGTH = 0;

const splitIntoSentences = (content: string): string[] => {
	return content
		.split(SENTENCE_BOUNDARY)
		.map((sentence) => sentence.trim())
		.filter((sentence) => sentence.length > EMPTY_LENGTH);
};

export { splitIntoSentences };
