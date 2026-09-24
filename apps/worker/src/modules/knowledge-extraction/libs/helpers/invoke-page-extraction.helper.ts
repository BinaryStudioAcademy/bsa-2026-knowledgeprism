import { InvokeModelCommand } from "@aws-sdk/client-bedrock-runtime";
import { BedrockRequest, ClaudeModelId } from "@knowledgeprism/constants";

import { ExtractionBedrockConfig } from "~/bedrock/bedrock-request.constant.js";
import { bedrockRuntimeClient } from "~/bedrock/bedrock.js";
import { toResponseText } from "~/bedrock/to-response-text.helper.js";
import { logger } from "~/logger/logger.js";

import {
	EXTRACTION_SYSTEM_PROMPT,
	PAGE_CONTENT_TAG,
} from "../constants/extraction-prompt.constant.js";

const toPagePrompt = (content: string): string => {
	return `<${PAGE_CONTENT_TAG}>\n${content}\n</${PAGE_CONTENT_TAG}>`;
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
