const FIRST_FOLLOWING_FRAGMENT = 1;
const LAST_CHARACTER_OFFSET = 1;
const LINE_BREAK = /\r?\n/u;
const NOT_FOUND_INDEX = -1;
const WHITESPACE = /\s/u;
const WHITESPACE_RUN = /\s+/gu;

type CompactText = {
	positions: number[];
	text: string;
};

const toCompactText = (value: string): CompactText => {
	const positions: number[] = [];
	let text = "";

	for (let index = 0; index < value.length; index++) {
		const character = value.charAt(index);

		if (!WHITESPACE.test(character)) {
			positions.push(index);
			text += character;
		}
	}

	return { positions, text };
};

const toFragments = (excerpt: string): string[] => {
	return excerpt
		.split(LINE_BREAK)
		.map((line) => line.replaceAll(WHITESPACE_RUN, ""))
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

export { locateSourceSpan };
