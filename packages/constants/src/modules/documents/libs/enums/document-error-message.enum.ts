const DocumentErrorMessage = {
	CANCEL_NOT_ALLOWED: "Document cannot be cancelled in its current state",
	FORBIDDEN: "You do not have permission to add knowledge",
	NOT_FOUND: "Document not found",
	PROCESSING_FAILED: "Processing failed",
	PROJECT_NOT_FOUND: "Project not found",
	RETRY_NOT_ALLOWED: "Document cannot be retried in its current state",
	UNAUTHORIZED: "Unauthorized",
} as const;

export { DocumentErrorMessage };
