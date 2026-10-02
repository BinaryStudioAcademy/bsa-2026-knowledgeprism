const ExtractionChunk = {
	MAXIMUM_CONCURRENT_REQUESTS: 4,
	MAXIMUM_LENGTH: 24_000,
	SEPARATORS: ["\n\n", "\n", " "],
} as const;

export { ExtractionChunk };
