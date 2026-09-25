const DocumentErrorMessage = {
	APPLY_NOT_ALLOWED: "Document is not waiting for approval",
	CANCEL_NOT_ALLOWED: "Document cannot be cancelled in its current state",
	CONFIRM_NOT_ALLOWED: "Document cannot be confirmed in its current state",
	CONFLICT_RESOLUTIONS_MISMATCH: "Every conflict must be resolved exactly once",
	DUPLICATE_ENTRY_WRITES:
		"Two changes cannot write the same field of one knowledge entry",
	EXTRACTION_ITEM_NOT_FOUND: "Extraction item not found",
	EXTRACTION_ITEM_NOT_PENDING: "Only pending extraction items can be edited",
	FORBIDDEN: "You do not have permission to add knowledge",
	INTEGRATION_FAILED: "Integration analysis failed",
	NOT_FOUND: "Document not found",
	PROCESSING_FAILED: "Processing failed",
	PROCESSING_INTERRUPTED: "Processing was interrupted. Please retry.",
	PROJECT_NOT_FOUND: "Project not found",
	RETRY_NOT_ALLOWED: "Document cannot be retried in its current state",
	REVIEW_ITEMS_MISMATCH:
		"Every pending item must be approved or rejected exactly once",
	REVIEW_NOT_ALLOWED: "Document is not waiting for validation",
	UNAUTHORIZED: "Unauthorized",
	UPLOAD_OBJECT_NOT_FOUND: "Uploaded document was not found in S3.",
	UPLOAD_OBJECT_TOO_LARGE:
		"Uploaded document exceeds the maximum allowed file size.",
	UPLOAD_VERIFICATION_FAILED:
		"Failed to verify uploaded document in S3. Please try again.",
} as const;

export { DocumentErrorMessage };
