const ExtractionChunk = {
	MAXIMUM_CONCURRENT_REQUESTS: 8,
	MAXIMUM_LENGTH: 8000,
	SEPARATORS: ["\n\n", "\n", " "],
} as const;

export { ExtractionChunk };
