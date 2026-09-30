const BedrockResponseFailure = {
	INVALID_RESPONSE: "invalid_response",
	REFUSAL: "refusal",
	TRUNCATED: "truncated",
} as const;

type Failure =
	(typeof BedrockResponseFailure)[keyof typeof BedrockResponseFailure];

class BedrockResponseError extends Error {
	public readonly reason: Failure;

	public constructor(reason: Failure) {
		super(`Bedrock response failed: ${reason}.`);
		this.name = "BedrockResponseError";
		this.reason = reason;
	}
}

export { BedrockResponseError, BedrockResponseFailure };
