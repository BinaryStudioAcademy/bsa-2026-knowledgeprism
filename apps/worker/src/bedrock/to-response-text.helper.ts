import {
	BedrockResponseError,
	BedrockResponseFailure,
} from "./bedrock-response-error.exception.js";
import { BedrockStopReason } from "./bedrock-stop-reason.constant.js";

type AnthropicTextBlock = {
	text: string;
};

const isTextBlock = (value: unknown): value is AnthropicTextBlock => {
	return (
		typeof value === "object" &&
		value !== null &&
		"type" in value &&
		value.type === "text" &&
		"text" in value &&
		typeof value.text === "string"
	);
};

const toResponseText = (decoded: string): string => {
	let envelope: unknown;

	try {
		envelope = JSON.parse(decoded);
	} catch {
		throw new BedrockResponseError(BedrockResponseFailure.INVALID_RESPONSE);
	}

	if (
		typeof envelope !== "object" ||
		envelope === null ||
		!("stop_reason" in envelope)
	) {
		throw new BedrockResponseError(BedrockResponseFailure.INVALID_RESPONSE);
	}

	if (
		envelope.stop_reason === BedrockStopReason.MAX_TOKENS ||
		envelope.stop_reason === BedrockStopReason.MODEL_CONTEXT_WINDOW_EXCEEDED
	) {
		throw new BedrockResponseError(BedrockResponseFailure.TRUNCATED);
	}

	if (envelope.stop_reason === BedrockStopReason.REFUSAL) {
		throw new BedrockResponseError(BedrockResponseFailure.REFUSAL);
	}

	if (
		envelope.stop_reason !== BedrockStopReason.END_TURN ||
		!("content" in envelope) ||
		!Array.isArray(envelope.content)
	) {
		throw new BedrockResponseError(BedrockResponseFailure.INVALID_RESPONSE);
	}

	const text = envelope.content
		.filter(isTextBlock)
		.map((block) => block.text)
		.join("");

	if (text.trim() === "") {
		throw new BedrockResponseError(BedrockResponseFailure.INVALID_RESPONSE);
	}

	return text;
};

export { toResponseText };
