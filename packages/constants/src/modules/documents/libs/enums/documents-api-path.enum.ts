const DocumentsApiPath = {
	CONFIRM_UPLOAD: "/:projectId/documents/:documentId/confirm-upload",
	UPLOAD_URL: "/:projectId/documents/upload-url",
} as const;

export { DocumentsApiPath };
