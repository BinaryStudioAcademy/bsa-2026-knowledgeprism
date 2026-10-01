import { type KnowledgeItem } from "../types/knowledge-item.type.js";

const ExtractionBlockType = {
	HEADING: "heading",
} as const;

const FIRST_INDEX = 0;
const HASH_MARK = "#";
const HASH_STEP = 1;
const LAST_INDEX = -1;
const MAX_HEADING_HASHES = 6;
const MIN_HEADING_HASHES = 1;

const readLastNonEmptyLine = (content: string): null | string => {
	const lines = content.split(/\r?\n/u);
	let index = lines.length + LAST_INDEX;

	while (index >= FIRST_INDEX) {
		const line = lines[index]?.trim() ?? "";

		if (line !== "") {
			return line;
		}

		index += LAST_INDEX;
	}

	return null;
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

const readBlockText = (item: KnowledgeItem): null | string => {
	const lastBlock = item.blocks.at(LAST_INDEX);

	if (!lastBlock || lastBlock.type !== ExtractionBlockType.HEADING) {
		return null;
	}

	return lastBlock.content
		.map((run) => run.text)
		.join("")
		.trim();
};

const readPreviousHeading = (
	chunkContent: string,
	items: readonly KnowledgeItem[],
): null | string => {
	const lastLine = readLastNonEmptyLine(chunkContent);

	if (lastLine === null) {
		return null;
	}

	const markdownTitle = readMarkdownTitle(lastLine);

	if (markdownTitle !== null) {
		return markdownTitle;
	}

	const lastItem = items.at(LAST_INDEX);

	if (!lastItem) {
		return null;
	}

	if (readBlockText(lastItem) !== lastLine) {
		return null;
	}

	return lastItem.heading;
};

export { readPreviousHeading };
