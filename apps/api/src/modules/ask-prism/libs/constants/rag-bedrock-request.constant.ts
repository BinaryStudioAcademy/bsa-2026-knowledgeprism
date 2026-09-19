const RagBedrockRequest = {
	ANTHROPIC_VERSION: "bedrock-2023-05-31",
	CLAUDE_MODEL_ID: "eu.anthropic.claude-3-5-sonnet-20241022-v2:0",
	MAX_TOKENS: 4096,
	TEMPERATURE: 0.1,
} as const;

export { RagBedrockRequest };
