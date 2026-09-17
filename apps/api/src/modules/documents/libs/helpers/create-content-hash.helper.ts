import { createHash } from "node:crypto";

const HASH_ALGORITHM = "sha256";
const TITLE_CONTENT_SEPARATOR = "\0";

const createContentHash = (title: null | string, content: string): string => {
	const normalizedTitle = title ?? "";

	return createHash(HASH_ALGORITHM)
		.update(`${normalizedTitle}${TITLE_CONTENT_SEPARATOR}${content}`)
		.digest("hex");
};

export { createContentHash };
