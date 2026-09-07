const DocumentStatus = {
	CANCELLED: "CANCELLED",
	FAILED: "FAILED",
	PROCESSING: "PROCESSING",
	WAITING_FOR_APPROVAL: "WAITING_FOR_APPROVAL",
} as const;

export { DocumentStatus };
