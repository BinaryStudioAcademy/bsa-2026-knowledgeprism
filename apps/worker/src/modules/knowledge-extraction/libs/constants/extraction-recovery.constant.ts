const ExtractionRecovery = {
	MAXIMUM_ATTEMPTS: 3,
	MINIMUM_SPLIT_LENGTH: 512,
	RETRY_DELAY_MS: 1000,
	SPLIT_PARTS: 2,
} as const;

export { ExtractionRecovery };
