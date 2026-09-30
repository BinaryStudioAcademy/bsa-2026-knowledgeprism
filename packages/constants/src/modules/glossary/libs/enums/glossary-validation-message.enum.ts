const GlossaryValidationMessage = {
	CONTENT_EMPTY: "Content is required",
	CONTENT_MAXIMUM_LENGTH: "Content must be at most 20000 characters",
	DEFINITION_EMPTY: "Definition is required",
	DEFINITION_MAXIMUM_LENGTH: "Definition must be at most 1000 characters",
	ID_WRONG: "Glossary term ID must be a positive integer",
	NAME_ALREADY_EXISTS: "A term with this name already exists in this project",
	NAME_EMPTY: "Term name is required",
	NAME_MAXIMUM_LENGTH: "Term name must be at most 100 characters",
	NOT_FOUND: "Glossary term not found",
	QUERY_MAXIMUM_LENGTH: "Search query must be at most 100 characters",
	RELATED_TERMS_INVALID: "Related terms must be other terms in this project",
	RELATED_TERMS_MAXIMUM_COUNT: "A term can have at most 20 related terms",
} as const;

export { GlossaryValidationMessage };
