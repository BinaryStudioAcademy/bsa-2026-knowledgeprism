const DocumentErrorMessage = {
	CANCEL_NOT_ALLOWED: "Document cannot be cancelled in its current state",
	CONFIRM_NOT_ALLOWED: "Document cannot be confirmed in its current state",
	FORBIDDEN: "You do not have permission to add knowledge",
	NOT_FOUND: "Document not found",
	PROCESSING_FAILED: "Processing failed",
	PROCESSING_INTERRUPTED: "Processing was interrupted. Please retry.",
	PROJECT_NOT_FOUND: "Project not found",
	RETRY_NOT_ALLOWED: "Document cannot be retried in its current state",
	REVIEW_ITEMS_MISMATCH:
		"Every pending item must be approved or rejected exactly once",
	REVIEW_NOT_ALLOWED: "Document is not waiting for approval",
	UNAUTHORIZED: "Unauthorized",
} as const;

export { DocumentErrorMessage };
