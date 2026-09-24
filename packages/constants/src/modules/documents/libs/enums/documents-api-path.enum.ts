const DocumentsApiPath = {
	CANCEL: "/:projectId/manual-text/:id/cancel",
	CONFIRM_UPLOAD: "/:projectId/documents/:documentId/confirm-upload",
	DOCUMENT_$ID: "/:projectId/documents/:documentId",
	DOCUMENT_RETRY: "/:projectId/documents/:documentId/retry",
	EXTRACTION_ITEMS: "/:projectId/documents/:documentId/extraction-items",
	EXTRACTION_ITEMS_REVIEW:
		"/:projectId/documents/:documentId/extraction-items/review",
	INTEGRATION_CHANGES: "/:projectId/documents/:documentId/integration-changes",
	MANUAL_TEXT: "/:projectId/manual-text",
	MANUAL_TEXT_$ID: "/:projectId/manual-text/:id",
	RETRY: "/:projectId/manual-text/:id/retry",
	UPLOAD_URL: "/:projectId/documents/upload-url",
} as const;

export { DocumentsApiPath };
