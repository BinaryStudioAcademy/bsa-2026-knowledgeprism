import { flattenContentToText } from "@knowledgeprism/config";

import { type EmbeddingEntry } from "../types/embedding-entry.type.js";

const HEADING_BLOCK_TYPE = "heading";
const NON_WORD_CHARACTERS = /[^\p{L}\p{N}]+/gu;

const isRecord = (value: unknown): value is Record<string, unknown> => {
	return typeof value === "object" && value !== null && !Array.isArray(value);
};

const normalizeTitle = (value: string): string => {
	return value.toLowerCase().replaceAll(NON_WORD_CHARACTERS, " ").trim();
};

const isTitleHeading = (
	block: Record<string, unknown>,
	title: string,
): boolean => {
	return (
		block["type"] === HEADING_BLOCK_TYPE &&
		normalizeTitle(flattenContentToText([block])) === normalizeTitle(title)
	);
};

const toEmbeddingEntry = ({
	blocks,
	title,
}: {
	blocks: unknown[];
	title: string;
}): EmbeddingEntry => {
	const records = blocks.filter((block) => isRecord(block));
	const [first, ...rest] = records;
	const body = first && isTitleHeading(first, title) ? rest : records;

	return { text: flattenContentToText(body), title: title.trim() };
};

export { toEmbeddingEntry };
