import { ExtractionRecovery } from "../constants/extraction-recovery.constant.js";

const FIRST_CHARACTER_INDEX = 0;
const LINE_BREAK = /[\r\n]/gu;
const PARAGRAPH_BOUNDARY = /\r?\n[\t ]*\r?\n/gu;

const findClosestBoundary = (
	content: string,
	boundaries: number[],
): null | number => {
	const midpoint = content.length / ExtractionRecovery.SPLIT_PARTS;
	const minimumLength =
		content.length * ExtractionRecovery.MINIMUM_CHILD_FRACTION;
	let closest: null | number = null;
	let closestDistance = Infinity;

	for (const boundary of boundaries) {
		if (
			boundary < minimumLength ||
			boundary > content.length - minimumLength ||
			content.slice(FIRST_CHARACTER_INDEX, boundary).trim() === "" ||
			content.slice(boundary).trim() === ""
		) {
			continue;
		}

		const distance = Math.abs(boundary - midpoint);

		if (distance < closestDistance) {
			closest = boundary;
			closestDistance = distance;
		}
	}

	return closest;
};

const splitTruncatedChunk = (content: string): [string, string] | null => {
	const paragraphBoundaries = content
		.matchAll(PARAGRAPH_BOUNDARY)
		.map((match) => match.index + match[FIRST_CHARACTER_INDEX].length)
		.toArray();
	let splitIndex = findClosestBoundary(content, paragraphBoundaries);

	if (splitIndex === null) {
		// PDF line wrapping is not a sentence boundary. Keep offsets unchanged.
		const sentenceContent = content.replaceAll(LINE_BREAK, " ");
		const sentences = new Intl.Segmenter("en", {
			granularity: "sentence",
		}).segment(sentenceContent);
		const sentenceBoundaries = [...sentences].map(
			({ index, segment }) => index + segment.length,
		);
		splitIndex = findClosestBoundary(content, sentenceBoundaries);
	}

	// An indivisible sentence stays incomplete rather than being silently fragmented.
	if (splitIndex === null) {
		return null;
	}

	return [
		content.slice(FIRST_CHARACTER_INDEX, splitIndex),
		content.slice(splitIndex),
	];
};

export { splitTruncatedChunk };
