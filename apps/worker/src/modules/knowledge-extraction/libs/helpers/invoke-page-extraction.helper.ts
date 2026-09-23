import { InvokeModelCommand } from "@aws-sdk/client-bedrock-runtime";

import { bedrockRuntimeClient } from "~/bedrock/bedrock.js";
import { logger } from "~/logger/logger.js";

import { BedrockRequest, ClaudeModelId } from "@knowledgeprism/constants";

import { ExtractionBedrockConfig } from "../constants/bedrock-request.constant.js";
import {
	EXTRACTION_SYSTEM_PROMPT,
	PAGE_CONTENT_TAG,
} from "../constants/extraction-prompt.constant.js";

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

const toPagePrompt = (content: string): string => {
	return `<${PAGE_CONTENT_TAG}>\n${content}\n</${PAGE_CONTENT_TAG}>`;
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

const invokePageExtraction = async (content: string): Promise<unknown> => {
	const body = JSON.stringify({
		anthropic_version: BedrockRequest.ANTHROPIC_VERSION,
		max_tokens: BedrockRequest.MAX_TOKENS,
		messages: [{ content: toPagePrompt(content), role: "user" }],
		system: EXTRACTION_SYSTEM_PROMPT,
		temperature: ExtractionBedrockConfig.TEMPERATURE,
	});

	try {
		const response = await bedrockRuntimeClient.send(
			new InvokeModelCommand({
				accept: "application/json",
				body,
				contentType: "application/json",
				modelId: ClaudeModelId.SONNET_4_6,
			}),
		);

		return toResponseText(response.body.transformToString());
	} catch (error) {
		logger.error("Failed to invoke page extraction.", { error });

		throw error;
	}
};

export { invokePageExtraction };
