const DocumentProcessingStatus = {
	FAILED: "failed",
	IDLE: "idle",
	PROCESSING: "processing",
	READY: "ready",
} as const;

const SearchStatus = {
	FAILED: "failed",
	IDLE: "idle",
	LOADING: "loading",
	SUCCEEDED: "succeeded",
} as const;

export { DocumentProcessingStatus, SearchStatus };
