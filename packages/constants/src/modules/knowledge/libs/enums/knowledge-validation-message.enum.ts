const KnowledgeValidationMessage = {
	CONTENT_EMPTY: "Content cannot be empty",
	FORBIDDEN:
		"You do not have permission to edit knowledge base entries in this project",
	NOT_FOUND: "Knowledge base entry not found",
	TITLE_EMPTY: "Title cannot be empty",
	TITLE_MAXIMUM_LENGTH: "Title cannot exceed 255 characters",
} as const;

export { KnowledgeValidationMessage };
