const PDF_MIME_TYPE = "application/pdf";
const SUPPORTED_FILE_EXTENSIONS = [".pdf"] as const;
const SUPPORTED_FILE_MIME_TYPES = [PDF_MIME_TYPE] as const;

const DocumentValidationMessage = {
	EMPTY_FILE: "The selected file is empty.",
	FILE_TOO_LARGE: "File is too large. Maximum file size is 25 MB.",
	PROCESSING_FAILED: "Processing failed",
	UNSUPPORTED_FORMAT: "Unsupported file format. Please upload a PDF file.",
} as const;

const EMPTY_LENGTH = 0;
const NOT_FOUND_INDEX = -1;
const MIN_INDEX = 0;
const START_INDEX = 0;
const INDEX_OFFSET = 1;
const LAST_INDEX_OFFSET = 1;
const FALLBACK_DEFER_EXECUTION_MS = 0;
const FOCUS_DELAY_MS = 10;
const POLL_DOCUMENT_STATUS_INTERVAL_MS = 3000;

const KNOWLEDGE_TREE_ITEM_CONFIG = {
	BASE_PADDING: 10,
	DEFAULT_LEVEL: 0,
	LEVEL_INCREMENT: 1,
	LEVEL_MULTIPLIER: 16,
	TAB_INDEX_FOCUSABLE: 0,
	TAB_INDEX_UNFOCUSABLE: -1,
} as const;

export {
	DocumentValidationMessage,
	EMPTY_LENGTH,
	FALLBACK_DEFER_EXECUTION_MS,
	FOCUS_DELAY_MS,
	INDEX_OFFSET,
	KNOWLEDGE_TREE_ITEM_CONFIG,
	LAST_INDEX_OFFSET,
	MIN_INDEX,
	NOT_FOUND_INDEX,
	PDF_MIME_TYPE,
	POLL_DOCUMENT_STATUS_INTERVAL_MS,
	START_INDEX,
	SUPPORTED_FILE_EXTENSIONS,
	SUPPORTED_FILE_MIME_TYPES,
};
export { FileValidationRule } from "@knowledgeprism/constants";
