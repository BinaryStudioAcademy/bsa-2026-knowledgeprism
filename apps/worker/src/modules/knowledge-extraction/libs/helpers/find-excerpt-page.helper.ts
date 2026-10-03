import { type ExtractionBlock } from "../types/extraction-block.type.js";
import { locateSourceSpanWithRange } from "./locate-source-span.helper.js";

const NOT_FOUND_INDEX = -1;

const findOffsetInContent = (
	content: string,
	excerpt: string,
): null | number => {
	const span = locateSourceSpanWithRange(content, excerpt);

	if (span !== null) {
		return span.range.start;
	}

	const offset = content.indexOf(excerpt);

	return offset === NOT_FOUND_INDEX ? null : offset;
};

const findExcerptPage = (chunk: ExtractionBlock, excerpt: string): number => {
	if (chunk.originalContent !== undefined) {
		const originalOffset = findOffsetInContent(chunk.originalContent, excerpt);

		if (originalOffset !== null) {
			const pageStarts = chunk.originalPageStarts ?? chunk.pageStarts;

			return (
				pageStarts?.findLast((start) => start.offset <= originalOffset)
					?.pageNumber ?? chunk.pageNumber
			);
		}
	}

	const offset = findOffsetInContent(chunk.content, excerpt);

	if (offset === null) {
		return chunk.pageNumber;
	}

	return (
		chunk.pageStarts?.findLast((start) => start.offset <= offset)?.pageNumber ??
		chunk.pageNumber
	);
};

export { findExcerptPage };
