const EmbeddingRequest = {
	MAX_TEXT_LENGTH: 2048,
	MAX_TEXTS_PER_REQUEST: 96,
	TRUNCATE: "END",
} as const;

export { EmbeddingRequest };
