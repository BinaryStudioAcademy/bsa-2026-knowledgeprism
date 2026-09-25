import { ExtractionChunk } from "../constants/extraction-chunk.constant.js";

type Separator = (typeof ExtractionChunk.SEPARATORS)[number];

const sliceByMaximumLength = (text: string): string[] => {
	const slices: string[] = [];

	for (
		let start = 0;
		start < text.length;
		start += ExtractionChunk.MAXIMUM_LENGTH
	) {
		slices.push(text.slice(start, start + ExtractionChunk.MAXIMUM_LENGTH));
	}

	return slices;
};

const mergePieces = (pieces: string[], separator: Separator): string[] => {
	const chunks: string[] = [];
	let current = "";

	for (const piece of pieces) {
		if (piece.trim() === "") {
			continue;
		}

		const candidate = current === "" ? piece : `${current}${separator}${piece}`;

		if (candidate.length <= ExtractionChunk.MAXIMUM_LENGTH) {
			current = candidate;
			continue;
		}

		if (current !== "") {
			chunks.push(current);
		}

		current = piece;
	}

	if (current !== "") {
		chunks.push(current);
	}

	return chunks;
};

const splitWithSeparators = (
	text: string,
	separators: readonly Separator[],
): string[] => {
	if (text.length <= ExtractionChunk.MAXIMUM_LENGTH) {
		return [text];
	}

	const [separator, ...nextSeparators] = separators;

	if (!separator) {
		return sliceByMaximumLength(text);
	}

	const pieces = text.split(separator).flatMap((piece) => {
		return splitWithSeparators(piece, nextSeparators);
	});

	return mergePieces(pieces, separator);
};

const splitIntoChunks = (text: string): string[] => {
	return splitWithSeparators(text, ExtractionChunk.SEPARATORS);
};

export { splitIntoChunks };
