import { InvokeModelCommand } from "@aws-sdk/client-bedrock-runtime";

import { bedrockRuntimeClient } from "~/bedrock/bedrock.js";

import { BedrockRequest } from "../constants/bedrock-request.constant.js";
import { ClaudeModelId } from "../constants/claude-model.constant.js";
import { EXTRACTION_SYSTEM_PROMPT } from "../constants/extraction-prompt.constant.js";

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
	const envelope: unknown = JSON.parse(decoded);

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
	const response = await bedrockRuntimeClient.send(
		new InvokeModelCommand({
			accept: "application/json",
			body: JSON.stringify({
				anthropic_version: BedrockRequest.ANTHROPIC_VERSION,
				max_tokens: BedrockRequest.MAX_TOKENS,
				messages: [{ content, role: "user" }],
				system: EXTRACTION_SYSTEM_PROMPT,
				temperature: BedrockRequest.TEMPERATURE,
			}),
			contentType: "application/json",
			modelId: ClaudeModelId.SONNET_4_6,
		}),
	);

	return toResponseText(response.body.transformToString());
};

export { invokePageExtraction };
