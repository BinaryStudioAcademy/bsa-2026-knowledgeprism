const FIRST_FOLLOWING_FRAGMENT = 1;
const EDGE_CHARACTER = /[\s\p{P}]/u;
const TRAILING_PUNCTUATION = /\p{P}/u;
const FIRST_INDEX = 0;
const LAST_CHARACTER_OFFSET = 1;
const LINE_BREAK = /\r?\n/u;
const NOT_FOUND_INDEX = -1;
const WHITESPACE = /\s/u;

const TypographicCharacter = {
	DASHES: /[‐-―−]/u,
	DOUBLE_QUOTES: /[“”„‟″]/u,
	SINGLE_QUOTES: /[‘’‚‛′]/u,
} as const;

const PlainCharacter = {
	DASH: "-",
	DOUBLE_QUOTE: "\u{22}",
	SINGLE_QUOTE: "'",
} as const;

type CompactText = {
	positions: number[];
	text: string;
};

type LocatedSourceSpan = {
	range: {
		end: number;
		start: number;
	};
	text: string;
};

const toPlainCharacter = (character: string): string => {
	if (TypographicCharacter.SINGLE_QUOTES.test(character)) {
		return PlainCharacter.SINGLE_QUOTE;
	}

	if (TypographicCharacter.DOUBLE_QUOTES.test(character)) {
		return PlainCharacter.DOUBLE_QUOTE;
	}

	if (TypographicCharacter.DASHES.test(character)) {
		return PlainCharacter.DASH;
	}

	return character;
};

const toCompactText = (value: string): CompactText => {
	const positions: number[] = [];
	let text = "";

	for (let index = 0; index < value.length; index++) {
		const character = value.charAt(index);

		if (!WHITESPACE.test(character)) {
			positions.push(index);
			text += toPlainCharacter(character);
		}
	}

	return { positions, text };
};

const toFragments = (excerpt: string): string[] => {
	return excerpt
		.split(LINE_BREAK)
		.map((line) => toCompactText(line).text)
		.filter((line) => line !== "");
};

const locateSourceSpanWithRange = (
	chunkContent: string,
	sourceExcerpt: string,
): LocatedSourceSpan | null => {
	const fragments = toFragments(sourceExcerpt);
	const [firstFragment] = fragments;

	if (!firstFragment) {
		return null;
	}

	const source = toCompactText(chunkContent);
	const spanStart = source.text.indexOf(firstFragment);

	if (spanStart === NOT_FOUND_INDEX) {
		return null;
	}

	let spanEnd = spanStart + firstFragment.length;

	for (const fragment of fragments.slice(FIRST_FOLLOWING_FRAGMENT)) {
		const index = source.text.indexOf(fragment, spanEnd);

		if (index === NOT_FOUND_INDEX) {
			return null;
		}

		spanEnd = index + fragment.length;
	}

	const startPosition = source.positions[spanStart];
	const lastPosition = source.positions[spanEnd - LAST_CHARACTER_OFFSET];

	if (startPosition === undefined || lastPosition === undefined) {
		return null;
	}

	const endPosition = lastPosition + LAST_CHARACTER_OFFSET;

	return {
		range: {
			end: endPosition,
			start: startPosition,
		},
		text: chunkContent.slice(startPosition, endPosition),
	};
};

const locateSourceSpan = (
	chunkContent: string,
	sourceExcerpt: string,
): null | string => {
	return locateSourceSpanWithRange(chunkContent, sourceExcerpt)?.text ?? null;
};

const trimEdgePunctuation = (value: string): string => {
	let start = FIRST_INDEX;
	let end = value.length;

	while (start < end && EDGE_CHARACTER.test(value.charAt(start))) {
		start++;
	}

	while (
		end > start &&
		EDGE_CHARACTER.test(value.charAt(end - LAST_CHARACTER_OFFSET))
	) {
		end--;
	}

	return value.slice(start, end);
};

const locateAnchor = (content: string, anchor: string): null | string => {
	const trimmed = trimEdgePunctuation(anchor);

	return (
		locateSourceSpan(content, anchor) ??
		(trimmed === "" ? null : locateSourceSpan(content, trimmed))
	);
};
const locateAnchorWithRange = (
	content: string,
	anchor: string,
): LocatedSourceSpan | null => {
	const trimmed = trimEdgePunctuation(anchor);

	return (
		locateSourceSpanWithRange(content, anchor) ??
		(trimmed === "" ? null : locateSourceSpanWithRange(content, trimmed))
	);
};

const locateAnchoredSpanWithRange = (
	chunkContent: string,
	{ end, start }: { end: string; start: string },
): LocatedSourceSpan | null => {
	const startSpan = locateAnchorWithRange(chunkContent, start);

	if (startSpan === null) {
		return null;
	}

	const restOffset = chunkContent.indexOf(startSpan.text);
	const rest = chunkContent.slice(restOffset);

	const endSpan = locateAnchorWithRange(rest, end);

	if (endSpan === null) {
		return null;
	}

	let spanEnd = endSpan.range.end;

	while (
		spanEnd < rest.length &&
		TRAILING_PUNCTUATION.test(rest.charAt(spanEnd))
	) {
		spanEnd++;
	}

	if (spanEnd < startSpan.text.length) {
		return startSpan;
	}

	const endPosition = restOffset + spanEnd;

	return {
		range: {
			end: endPosition,
			start: restOffset,
		},
		text: chunkContent.slice(restOffset, endPosition),
	};
};

const locateAnchoredSpan = (
	chunkContent: string,
	{ end, start }: { end: string; start: string },
): null | string => {
	const startSpan = locateAnchor(chunkContent, start);

	if (startSpan === null) {
		return null;
	}

	const rest = chunkContent.slice(chunkContent.indexOf(startSpan));
	const endSpan = locateAnchor(rest, end);

	if (endSpan === null) {
		return null;
	}

	let spanEnd = rest.indexOf(endSpan) + endSpan.length;

	while (
		spanEnd < rest.length &&
		TRAILING_PUNCTUATION.test(rest.charAt(spanEnd))
	) {
		spanEnd++;
	}

	return spanEnd < startSpan.length
		? startSpan
		: rest.slice(FIRST_INDEX, spanEnd);
};

export {
	locateAnchoredSpan,
	locateAnchoredSpanWithRange,
	locateSourceSpan,
	locateSourceSpanWithRange,
};
