import { randomUUID } from "node:crypto";

const DEFAULT_FILE_NAME = "document.pdf";
const EXTENSION_SEPARATOR = ".";
const NOT_FOUND_INDEX = -1;
const START_INDEX = 0;
const STORAGE_KEY_MAXIMUM_LENGTH = 255;
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

const truncateFileName = (fileName: string, maximumLength: number): string => {
	if (fileName.length <= maximumLength) {
		return fileName;
	}

	const extensionIndex = fileName.lastIndexOf(EXTENSION_SEPARATOR);
	const extension =
		extensionIndex === NOT_FOUND_INDEX ? "" : fileName.slice(extensionIndex);

	if (extension.length >= maximumLength) {
		return fileName.slice(START_INDEX, maximumLength);
	}

	return `${fileName.slice(START_INDEX, maximumLength - extension.length)}${extension}`;
};

const buildDocumentStorageKey = ({
	fileName,
	projectId,
}: Parameters): string => {
	const prefix = `projects/${projectId}/docs/${Date.now().toString()}-${randomUUID()}-`;

	return `${prefix}${truncateFileName(sanitizeFileName(fileName), STORAGE_KEY_MAXIMUM_LENGTH - prefix.length)}`;
};

export { buildDocumentStorageKey };
