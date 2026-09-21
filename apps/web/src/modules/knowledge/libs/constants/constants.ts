const SUPPORTED_FILE_EXTENSIONS = [".pdf"] as const;

const SUPPORTED_FILE_MIME_TYPES = ["application/pdf"] as const;

const DocumentValidationMessage = {
	FILE_TOO_LARGE: "File is too large. Maximum file size is 25 MB.",
	PROCESSING_FAILED: "Processing failed",
	UNSUPPORTED_FORMAT: "Unsupported file format. Please upload a PDF file.",
} as const;

// TODO: replace with the real active project id once project routing/context lands.
const TEMPORARY_PROJECT_ID = "1";

export {
	DocumentValidationMessage,
	SUPPORTED_FILE_EXTENSIONS,
	SUPPORTED_FILE_MIME_TYPES,
	TEMPORARY_PROJECT_ID,
};
export { FileValidationRule } from "@knowledgeprism/constants";
