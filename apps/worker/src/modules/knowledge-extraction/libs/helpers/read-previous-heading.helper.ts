const FIRST_INDEX = 0;
const HASH_MARK = "#";
const HASH_STEP = 1;
const LAST_INDEX = -1;
const LINE_BREAK = /\r?\n/u;
const MAX_HEADING_HASHES = 6;
const MIN_HEADING_HASHES = 1;

const toNonEmptyLines = (content: string): string[] => {
	return content
		.split(LINE_BREAK)
		.map((line) => line.trim())
		.filter((line) => line !== "");
};

const readMarkdownTitle = (line: string): null | string => {
	let hashCount = 0;

	while (
		hashCount < MAX_HEADING_HASHES &&
		line.startsWith(HASH_MARK, hashCount)
	) {
		hashCount += HASH_STEP;
	}

	if (hashCount < MIN_HEADING_HASHES || line.startsWith(HASH_MARK, hashCount)) {
		return null;
	}

	const separator = line[hashCount];

	if (separator !== " " && separator !== "\t") {
		return null;
	}

	const title = line.slice(hashCount).trim();

	return title === "" ? null : title;
};

const hasLeadingHeading = (content: string): boolean => {
	const [firstLine] = toNonEmptyLines(content);

	return firstLine !== undefined && readMarkdownTitle(firstLine) !== null;
};

const readPreviousHeading = (previousContent: string): null | string => {
	const lines = toNonEmptyLines(previousContent);

	for (let index = lines.length + LAST_INDEX; index >= FIRST_INDEX; index--) {
		const title = readMarkdownTitle(lines[index] ?? "");

		if (title !== null) {
			return title;
		}
	}

	return null;
};

export { hasLeadingHeading, readPreviousHeading };
