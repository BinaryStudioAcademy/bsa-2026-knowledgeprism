import { randomUUID } from "node:crypto";

const DEFAULT_FILE_NAME = "document.pdf";
const FILE_NAME_SEPARATOR_PATTERN = /[/\\]/g;
const LEADING_UNSAFE_STORAGE_KEY_SEGMENT_PATTERN = /^[.-]+/;
const REPEATED_DASH_PATTERN = /-+/g;
const REPEATED_DOT_PATTERN = /\.{2,}/g;
const UNSAFE_FILE_NAME_CHARACTER_PATTERN = /[^a-zA-Z0-9._-]/g;

type Parameters = {
	fileName: string;
	projectId: string;
};

const sanitizeStorageKeySegment = (value: string): string => {
	return value
		.replaceAll(FILE_NAME_SEPARATOR_PATTERN, "-")
		.replaceAll("\u{0}", "")
		.trim()
		.replaceAll(UNSAFE_FILE_NAME_CHARACTER_PATTERN, "-")
		.replaceAll(REPEATED_DOT_PATTERN, ".")
		.replaceAll(REPEATED_DASH_PATTERN, "-")
		.replace(LEADING_UNSAFE_STORAGE_KEY_SEGMENT_PATTERN, "");
};

const sanitizeFileName = (fileName: string): string => {
	const normalizedFileName = sanitizeStorageKeySegment(fileName);

	return normalizedFileName || DEFAULT_FILE_NAME;
};

const buildDocumentStorageKey = ({
	fileName,
	projectId,
}: Parameters): string => {
	return `projects/${projectId}/docs/${Date.now().toString()}-${randomUUID()}-${sanitizeFileName(fileName)}`;
};

export { buildDocumentStorageKey };
