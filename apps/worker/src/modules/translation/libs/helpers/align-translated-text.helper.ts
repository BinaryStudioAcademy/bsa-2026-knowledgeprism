import { SourceMapping, SourceRange } from "../types/source-mapping.type.js";

const EMPTY_COUNT = 0;
const FIRST_INDEX = 0;
const LAST_ITEM_INDEX = -1;

const alignTranslatedText = (
	original: string,
	translated: string,
): SourceMapping[] => {
	const segmenter = new Intl.Segmenter("en", {
		granularity: "sentence",
	});

	const originalSegments = [...segmenter.segment(original)];
	const translatedSegments = [...segmenter.segment(translated)];

	const count = Math.min(originalSegments.length, translatedSegments.length);

	const mappings: SourceMapping[] = [];

	for (let index = 0; index < count; index++) {
		const originalSegment = originalSegments[index];
		const translatedSegment = translatedSegments[index];

		if (!originalSegment || !translatedSegment) {
			continue;
		}

		mappings.push({
			source: {
				end: originalSegment.index + originalSegment.segment.length,
				start: originalSegment.index,
			},
			target: {
				end: translatedSegment.index + translatedSegment.segment.length,
				start: translatedSegment.index,
			},
		});
	}

	return mappings;
};

const mapTranslatedRangeToSourceRange = (
	mappings: SourceMapping[],
	targetRange: SourceRange,
): null | SourceRange => {
	const overlappingMappings = mappings.filter(
		({ target }) =>
			target.start < targetRange.end && target.end > targetRange.start,
	);

	if (overlappingMappings.length === EMPTY_COUNT) {
		return null;
	}

	const firstMapping = overlappingMappings[FIRST_INDEX];
	const lastMapping = overlappingMappings.at(LAST_ITEM_INDEX);

	if (!firstMapping || !lastMapping) {
		return null;
	}

	return {
		end: lastMapping.source.end,
		start: firstMapping.source.start,
	};
};

export { alignTranslatedText, mapTranslatedRangeToSourceRange };
