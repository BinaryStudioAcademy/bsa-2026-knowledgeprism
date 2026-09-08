const KnowledgeStep = {
	STEP_1: "knowledge-input",
	STEP_2: "integration-preview",
} as const;

const KnowledgeInputTab = {
	LINK: "link",
	TEXT: "text",
	UPLOAD: "upload",
} as const;

const DocumentProcessingStatus = {
	FAILED: "failed",
	IDLE: "idle",
	PROCESSING: "processing",
	READY: "ready",
	SUCCESS: "success",
} as const;

export { DocumentProcessingStatus, KnowledgeInputTab, KnowledgeStep };
