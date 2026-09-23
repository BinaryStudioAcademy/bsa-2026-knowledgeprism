import { logger } from "~/logger/logger.js";

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

	return envelope.content
		.filter(isTextBlock)
		.map((block) => {
			return block.text;
		})
		.join("");
};

export { toResponseText };
