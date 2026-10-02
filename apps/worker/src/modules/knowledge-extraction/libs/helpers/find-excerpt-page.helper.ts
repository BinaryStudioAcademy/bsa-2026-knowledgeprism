import { type ExtractionBlock } from "../types/extraction-block.type.js";

const NOT_FOUND_INDEX = -1;

const findExcerptPage = (chunk: ExtractionBlock, excerpt: string): number => {
	const offset = chunk.content.indexOf(excerpt);

	if (offset === NOT_FOUND_INDEX) {
		return chunk.pageNumber;
	}

	return (
		chunk.pageStarts?.findLast((start) => start.offset <= offset)?.pageNumber ??
		chunk.pageNumber
	);
};

export { findExcerptPage };
