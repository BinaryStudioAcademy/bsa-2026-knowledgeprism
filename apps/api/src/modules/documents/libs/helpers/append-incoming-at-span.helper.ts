const EMPTY_LENGTH = 0;
const NOT_FOUND_INDEX = -1;
const PARAGRAPH_BREAK = "\n\n";
const TEXT_START_INDEX = 0;

const appendIncomingAtSpan = (
	liveText: string,
	incomingText: string,
	span: string,
): string => {
	const incoming = incomingText.trim();

	if (incoming.length === EMPTY_LENGTH || liveText.includes(incoming)) {
		return liveText;
	}

	const trimmedSpan = span.trim();
	const spanIndex =
		trimmedSpan.length === EMPTY_LENGTH
			? NOT_FOUND_INDEX
			: liveText.indexOf(trimmedSpan);

	if (spanIndex === NOT_FOUND_INDEX) {
		return `${liveText}${PARAGRAPH_BREAK}${incoming}`.trim();
	}

	const spanEnd = spanIndex + trimmedSpan.length;

	return `${liveText.slice(TEXT_START_INDEX, spanEnd)}${PARAGRAPH_BREAK}${incoming}${liveText.slice(spanEnd)}`.trim();
};

export { appendIncomingAtSpan };
