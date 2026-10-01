const BedrockStopReason = {
	END_TURN: "end_turn",
	MAX_TOKENS: "max_tokens",
	MODEL_CONTEXT_WINDOW_EXCEEDED: "model_context_window_exceeded",
	REFUSAL: "refusal",
} as const;

export { BedrockStopReason };
