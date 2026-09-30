const ExtractionRecovery = {
	MAXIMUM_ATTEMPTS: 3,
	MINIMUM_CHILD_FRACTION: 0.25,
	MINIMUM_SPLIT_LENGTH: 512,
	RETRY_DELAY_MS: 1000,
	SPLIT_PARTS: 2,
} as const;

export { ExtractionRecovery };
