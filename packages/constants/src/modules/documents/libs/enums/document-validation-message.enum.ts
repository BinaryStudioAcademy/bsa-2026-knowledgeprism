import { DocumentValidationRule } from "./document-validation-rule.enum.js";

const DocumentValidationMessage = {
	CONTENT_MAXIMUM_LENGTH: `Content must be at most ${DocumentValidationRule.CONTENT_MAXIMUM_LENGTH.toLocaleString("en-US")} characters`,
	CONTENT_REQUIRED: "Content is required",
	CONTENT_TOO_SHORT: `Type more so Prism can extract knowledge. Use at least ${DocumentValidationRule.MANUAL_TEXT_CONTENT_MINIMUM_LENGTH.toString()} characters.`,
	IDENTIFIER_INVALID: "Identifier is invalid",
	TEXT_REQUIRED: "Text is required",
	TITLE_MAXIMUM_LENGTH: "Title must be at most 255 characters",
	TITLE_REQUIRED: "Title is required",
} as const;

export { DocumentValidationMessage };
