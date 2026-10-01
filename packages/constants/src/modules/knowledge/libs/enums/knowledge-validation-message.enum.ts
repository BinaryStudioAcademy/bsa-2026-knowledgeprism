const KnowledgeValidationMessage = {
	CONTENT_EMPTY: "Content cannot be empty",
	DOCUMENT_CYCLE: "A document cannot be moved under itself",
	DOCUMENT_DEPTH_EXCEEDED: "Documents can only be nested three levels deep",
	DOCUMENT_PARENT_INVALID:
		"A document can only be placed under another document",
	DOCUMENT_POSITION_INVALID: "Document position is outside its sibling list",
	FORBIDDEN:
		"You do not have permission to edit knowledge base entries in this project",
	ID_WRONG: "Knowledge base entry ID must be a positive integer",
	NOT_FOUND: "Knowledge base entry not found",
	PARENT_ID_WRONG: "Parent document ID must be a positive integer or empty",
	PARENT_NOT_FOUND: "Parent document not found",
	PROJECT_ID_WRONG: "Project ID must be a positive integer",
	SECTION_PARENT_REQUIRED: "A section must stay inside a document",
	TITLE_EMPTY: "Title cannot be empty",
	TITLE_MAXIMUM_LENGTH: "Title cannot exceed 255 characters",
} as const;

export { KnowledgeValidationMessage };
