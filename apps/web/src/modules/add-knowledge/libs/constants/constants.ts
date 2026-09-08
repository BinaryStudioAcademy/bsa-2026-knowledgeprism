const SUPPORTED_FILE_EXTENSIONS = [".pdf", ".txt"] as const;

const SUPPORTED_FILE_MIME_TYPES = ["application/pdf", "text/plain"] as const;

const DocumentValidationMessage = {
	FILE_TOO_LARGE: "File is too large. Maximum file size is 25 MB.",
	PROCESSING_FAILED: "Processing failed",
	UNSUPPORTED_FORMAT:
		"Unsupported file format. Please upload a PDF or TXT file.",
} as const;

const DEFAULT_DESTINATION = {
	BRANCH: "Hardware specs",
	PROJECT: "Project Alpha",
} as const;

const MOCK_PROCESSING_DELAY_MS = 1400;

export {
	DEFAULT_DESTINATION,
	DocumentValidationMessage,
	MOCK_PROCESSING_DELAY_MS,
	SUPPORTED_FILE_EXTENSIONS,
	SUPPORTED_FILE_MIME_TYPES,
};
export { FileValidationRule } from "@knowledgeprism/constants";
