import { logger } from "~/logger/logger.js";

import { BedrockStopReason } from "./bedrock-stop-reason.constant.js";

type AnthropicTextBlock = {
	text: string;
};

const isTextBlock = (value: unknown): value is AnthropicTextBlock => {
	return (
		typeof value === "object" &&
		value !== null &&
		"text" in value &&
		typeof value.text === "string"
	);
};

const toResponseText = (decoded: string): string => {
	let envelope: unknown;

	try {
		envelope = JSON.parse(decoded);
	} catch (error) {
		logger.error("Failed to parse Bedrock response body.", { error });

		return "";
	}

	if (
		typeof envelope !== "object" ||
		envelope === null ||
		!("content" in envelope) ||
		!Array.isArray(envelope.content)
	) {
		return "";
	}

	const stopReason = "stop_reason" in envelope ? envelope.stop_reason : null;

	if (
		stopReason === BedrockStopReason.MAX_TOKENS ||
		stopReason === BedrockStopReason.MODEL_CONTEXT_WINDOW_EXCEEDED
	) {
		throw new Error("Bedrock response was truncated before it finished.");
	}

	if (stopReason === BedrockStopReason.REFUSAL) {
		throw new Error("Bedrock declined to answer the request.");
	}

	return envelope.content
		.filter(isTextBlock)
		.map((block) => {
			return block.text;
		})
		.join("");
};

export { toResponseText };
