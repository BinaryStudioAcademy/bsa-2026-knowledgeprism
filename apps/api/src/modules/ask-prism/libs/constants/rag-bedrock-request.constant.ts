const RagBedrockRequest = {
	ANTHROPIC_VERSION: "bedrock-2023-05-31",
	CLAUDE_MODEL_ID: "eu.anthropic.claude-sonnet-4-6",
	MAX_TOKENS: 4096,
	TEMPERATURE: 0.1,
} as const;

export { RagBedrockRequest };
