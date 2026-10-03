import { mapTranslatedRangeToSourceRange } from "~/modules/translation/libs/helpers/align-translated-text.helper.js";

import { type ExtractionBlock } from "../types/extraction-block.type.js";

const DEFAULT_OFFSET = 0;
const NOT_FOUND_INDEX = -1;

const createTranslatedChunk = (
	parent: ExtractionBlock,
	content: string,
	searchFrom = DEFAULT_OFFSET,
): ExtractionBlock => {
	const translatedStart = parent.content.indexOf(content, searchFrom);

	if (translatedStart === NOT_FOUND_INDEX) {
		return {
			...parent,
			content,
		};
	}

	if (
		parent.originalContent === undefined ||
		parent.sourceMappings === undefined
	) {
		return {
			...parent,
			content,
		};
	}

	const translatedRange = {
		end: translatedStart + content.length,
		start: translatedStart,
	};

	const originalRange = mapTranslatedRangeToSourceRange(
		parent.sourceMappings,
		translatedRange,
	);

	if (originalRange === null) {
		return {
			...parent,
			content,
		};
	}

	const originalContent = parent.originalContent.slice(
		originalRange.start,
		originalRange.end,
	);

	const sourceMappings = parent.sourceMappings
		.filter(
			({ target }) =>
				target.start < translatedRange.end &&
				target.end > translatedRange.start,
		)
		.map(({ source, target }) => ({
			source: {
				end: source.end - originalRange.start,
				start: source.start - originalRange.start,
			},
			target: {
				end: target.end - translatedStart,
				start: target.start - translatedStart,
			},
		}));

	return {
		...parent,
		content,
		originalContent,
		sourceMappings,
		sourceRange: {
			end: (parent.sourceRange?.start ?? DEFAULT_OFFSET) + originalRange.end,
			start:
				(parent.sourceRange?.start ?? DEFAULT_OFFSET) + originalRange.start,
		},
	};
};

export { createTranslatedChunk };
