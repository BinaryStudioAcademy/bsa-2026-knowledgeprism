const KnowledgeValidationRule = {
	CONTENT_JSON_MINIMUM_ITEMS: 1,
	QUERY_MAXIMUM_LENGTH: 100,
	QUERY_MINIMUM_LENGTH: 1,
	TITLE_MAXIMUM_LENGTH: 255,
	TITLE_MINIMUM_LENGTH: 1,
} as const;

export { KnowledgeValidationRule };
