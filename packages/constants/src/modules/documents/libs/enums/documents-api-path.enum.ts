const DocumentsApiPath = {
	CANCEL: "/:projectId/manual-text/:id/cancel",
	CONFIRM_UPLOAD: "/:projectId/documents/:documentId/confirm-upload",
	MANUAL_TEXT: "/:projectId/manual-text",
	MANUAL_TEXT_$ID: "/:projectId/manual-text/:id",
	RETRY: "/:projectId/manual-text/:id/retry",
	UPLOAD_URL: "/:projectId/documents/upload-url",
} as const;

export { DocumentsApiPath };
