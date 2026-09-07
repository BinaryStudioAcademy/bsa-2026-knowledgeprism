const DocumentsApiPath = {
	CANCEL: "/:projectId/manual-text/:id/cancel",
	MANUAL_TEXT: "/:projectId/manual-text",
	MANUAL_TEXT_$ID: "/:projectId/manual-text/:id",
	RETRY: "/:projectId/manual-text/:id/retry",
} as const;

export { DocumentsApiPath };
