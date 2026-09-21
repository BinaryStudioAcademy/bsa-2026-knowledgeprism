const SUPPORTED_FILE_EXTENSIONS = [".pdf", ".txt"] as const;

const SUPPORTED_FILE_MIME_TYPES = ["application/pdf", "text/plain"] as const;

const DocumentValidationMessage = {
	FILE_TOO_LARGE: "File is too large. Maximum file size is 25 MB.",
	PROCESSING_FAILED: "Processing failed",
	UNSUPPORTED_FORMAT:
		"Unsupported file format. Please upload a PDF or TXT file.",
} as const;

const MOCK_PROCESSING_DELAY_MS = 1400;

const EMPTY_LENGTH = 0;
const NOT_FOUND_INDEX = -1;
const MIN_INDEX = 0;
const START_INDEX = 0;
const INDEX_OFFSET = 1;
const LAST_INDEX_OFFSET = 1;
const FALLBACK_DEFER_EXECUTION_MS = 0;
const FOCUS_DELAY_MS = 10;

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
	MOCK_PROCESSING_DELAY_MS,
	NOT_FOUND_INDEX,
	START_INDEX,
	SUPPORTED_FILE_EXTENSIONS,
	SUPPORTED_FILE_MIME_TYPES,
};
export { FileValidationRule } from "@knowledgeprism/constants";
