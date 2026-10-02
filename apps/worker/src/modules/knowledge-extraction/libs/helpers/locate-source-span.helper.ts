const FIRST_FOLLOWING_FRAGMENT = 1;
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

const locateSourceSpan = (
	chunkContent: string,
	sourceExcerpt: string,
): null | string => {
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

	return chunkContent.slice(
		startPosition,
		lastPosition + LAST_CHARACTER_OFFSET,
	);
};

const locateAnchoredSpan = (
	chunkContent: string,
	{ end, start }: { end: string; start: string },
): null | string => {
	const startSpan = locateSourceSpan(chunkContent, start);

	if (startSpan === null) {
		return null;
	}

	const rest = chunkContent.slice(chunkContent.indexOf(startSpan));
	const endSpan = locateSourceSpan(rest, end);

	if (endSpan === null) {
		return null;
	}

	const spanEnd = rest.indexOf(endSpan) + endSpan.length;

	return spanEnd < startSpan.length
		? startSpan
		: rest.slice(FIRST_INDEX, spanEnd);
};

export { locateAnchoredSpan, locateSourceSpan };
