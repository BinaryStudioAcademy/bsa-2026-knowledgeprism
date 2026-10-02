import { ExtractionChunk } from "../constants/extraction-chunk.constant.js";

type Separator = (typeof ExtractionChunk.SEPARATORS)[number];

const sliceByMaximumLength = (
	text: string,
	maximumLength: number,
): string[] => {
	const slices: string[] = [];

	for (let start = 0; start < text.length; start += maximumLength) {
		slices.push(text.slice(start, start + maximumLength));
	}

	return slices;
};

const mergePieces = (
	pieces: string[],
	{ maximumLength, separator }: { maximumLength: number; separator: Separator },
): string[] => {
	const chunks: string[] = [];
	let current = "";

	for (const piece of pieces) {
		if (piece.trim() === "") {
			continue;
		}

		const candidate = current === "" ? piece : `${current}${separator}${piece}`;

		if (candidate.length <= maximumLength) {
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
	maximumLength: number,
): string[] => {
	if (text.length <= maximumLength) {
		return [text];
	}

	const [separator, ...nextSeparators] = separators;

	if (!separator) {
		return sliceByMaximumLength(text, maximumLength);
	}

	const pieces = text.split(separator).flatMap((piece) => {
		return splitWithSeparators(piece, nextSeparators, maximumLength);
	});

	return mergePieces(pieces, { maximumLength, separator });
};

const splitIntoChunks = (
	text: string,
	maximumLength: number = ExtractionChunk.MAXIMUM_LENGTH,
): string[] => {
	return splitWithSeparators(text, ExtractionChunk.SEPARATORS, maximumLength);
};

export { splitIntoChunks };
