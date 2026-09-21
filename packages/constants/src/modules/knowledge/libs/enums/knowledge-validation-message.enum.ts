const KnowledgeValidationMessage = {
	CONTENT_EMPTY: "Content cannot be empty",
	FORBIDDEN:
		"You do not have permission to edit knowledge base entries in this project",
	ID_WRONG: "Knowledge base entry ID must be a positive integer",
	NOT_FOUND: "Knowledge base entry not found",
	PROJECT_ID_WRONG: "Project ID must be a positive integer",
	TITLE_EMPTY: "Title cannot be empty",
	TITLE_MAXIMUM_LENGTH: "Title cannot exceed 255 characters",
} as const;

export { KnowledgeValidationMessage };
