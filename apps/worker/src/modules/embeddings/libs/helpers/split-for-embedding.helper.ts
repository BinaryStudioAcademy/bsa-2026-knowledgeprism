import { EmbeddingChunk } from "../constants/embedding-chunk.constant.js";
import { type EmbeddingEntry } from "../types/embedding-entry.type.js";

const FIRST_INDEX = 0;
const TITLE_SEPARATOR = "\n";

const SENTENCE_SEGMENTER = new Intl.Segmenter("en", {
	granularity: "sentence",
});

const toChunkText = (title: string, body: string): string => {
	return title === "" ? body : `${title}${TITLE_SEPARATOR}${body}`;
};

const sliceToLength = (text: string, length: number): string[] => {
	const slices: string[] = [];

	for (let start = FIRST_INDEX; start < text.length; start += length) {
		slices.push(text.slice(start, start + length));
	}

	return slices;
};

const toSentencePieces = (text: string, length: number): string[] => {
	return Array.from(
		SENTENCE_SEGMENTER.segment(text),
		({ segment }) => segment,
	).flatMap((sentence) =>
		sentence.length > length ? sliceToLength(sentence, length) : [sentence],
	);
};

const splitForEmbedding = ({ text, title }: EmbeddingEntry): string[] => {
	const body = text.trim();
	const whole = toChunkText(title, body);

	if (body === "" || whole.length <= EmbeddingChunk.MAXIMUM_LENGTH) {
		return [whole.slice(FIRST_INDEX, EmbeddingChunk.MAXIMUM_LENGTH)];
	}

	const bodyLength =
		EmbeddingChunk.MAXIMUM_LENGTH -
		(title === "" ? FIRST_INDEX : title.length + TITLE_SEPARATOR.length);
	const chunks: string[] = [];
	let current = "";

	for (const piece of toSentencePieces(body, bodyLength)) {
		if (current !== "" && current.length + piece.length > bodyLength) {
			chunks.push(toChunkText(title, current.trim()));
			current = "";
		}

		current += piece;
	}

	if (current.trim() !== "") {
		chunks.push(toChunkText(title, current.trim()));
	}

	return chunks;
};

export { splitForEmbedding };
