import { type Node as ProseMirrorNode } from "prosemirror-model";

import { type TextHighlight, type TextHighlightRange } from "../types/types.js";

// A non-text inline node (hard break, mention, etc.) counts as one character in a
// textblock's flattened text, so a highlight's text never silently matches across it.
const NON_TEXT_NODE_PLACEHOLDER = "\u{FFFC}";
const NOT_FOUND_INDEX = -1;
const EMPTY_LENGTH = 0;
const CHAR_INDEX_STEP = 1;

type TextBlockIndex = {
	// charPositions[i] is the document position of character i of `text`.
	// The extra trailing entry is the position right after the block's last character.
	charPositions: number[];
	text: string;
};

const buildTextBlockIndex = (
	node: ProseMirrorNode,
	contentStartPos: number,
): TextBlockIndex => {
	let text = "";
	const charPositions: number[] = [];

	node.forEach((child, offset) => {
		const childPos = contentStartPos + offset;

		if (child.isText && child.text) {
			const childText = child.text;

			for (
				let index = EMPTY_LENGTH;
				index < childText.length;
				index += CHAR_INDEX_STEP
			) {
				charPositions.push(childPos + index);
			}

			text += childText;
		} else {
			charPositions.push(childPos);
			text += NON_TEXT_NODE_PLACEHOLDER;
		}
	});

	charPositions.push(contentStartPos + node.content.size);

	return { charPositions, text };
};

const collectTextBlockIndexes = (
	document_: ProseMirrorNode,
): TextBlockIndex[] => {
	const textBlocks: TextBlockIndex[] = [];

	document_.descendants((node, pos) => {
		if (!node.isTextblock) {
			return true;
		}

		const CONTENT_START_OFFSET = 1;

		textBlocks.push(buildTextBlockIndex(node, pos + CONTENT_START_OFFSET));

		return false;
	});

	return textBlocks;
};

const findHighlightRange = (
	textBlocks: readonly TextBlockIndex[],
	highlight: TextHighlight,
): null | { from: number; to: number } => {
	for (const textBlock of textBlocks) {
		const matchIndex = textBlock.text.indexOf(highlight.text);

		if (matchIndex !== NOT_FOUND_INDEX) {
			return {
				from: textBlock.charPositions[matchIndex] as number,
				to: textBlock.charPositions[
					matchIndex + highlight.text.length
				] as number,
			};
		}
	}

	return null;
};

const areRangesOverlapping = (
	first: { from: number; to: number },
	second: { from: number; to: number },
): boolean => first.from < second.to && second.from < first.to;

// First occurrence per highlight, matching the first-occurrence replace that Accept does;
// when two ranges overlap, the one found first wins.
const findTextHighlightRanges = (
	document_: ProseMirrorNode,
	highlights: readonly TextHighlight[],
): TextHighlightRange[] => {
	const textBlocks = collectTextBlockIndexes(document_);
	const ranges: TextHighlightRange[] = [];

	for (const highlight of highlights) {
		if (highlight.text.length === EMPTY_LENGTH) {
			continue;
		}

		const range = findHighlightRange(textBlocks, highlight);

		if (!range) {
			continue;
		}

		const hasOverlappingRange = ranges.some((existingRange) =>
			areRangesOverlapping(existingRange, range),
		);

		if (hasOverlappingRange) {
			continue;
		}

		ranges.push({
			from: range.from,
			id: highlight.id,
			to: range.to,
			variant: highlight.variant,
		});
	}

	return ranges.toSorted((first, second) => first.from - second.from);
};

export { findTextHighlightRanges };
