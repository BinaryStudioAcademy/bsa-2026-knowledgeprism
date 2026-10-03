import { InvokeModelCommand } from "@aws-sdk/client-bedrock-runtime";
import { BedrockRequest, ClaudeModelId } from "@knowledgeprism/constants";

import { ExtractionBedrockConfig } from "~/bedrock/bedrock-request.constant.js";
import { sendBedrockRequest } from "~/bedrock/send-bedrock-request.helper.js";
import { toResponseText } from "~/bedrock/to-response-text.helper.js";
import { logger } from "~/logger/logger.js";

import { OUTLINE_SYSTEM_PROMPT } from "../constants/outline-prompt.constant.js";
import {
	type OutlineRequest,
	toOutlinePrompt,
} from "./to-outline-prompt.helper.js";

const invokeOutline = async (request: OutlineRequest): Promise<unknown> => {
	const body = JSON.stringify({
		anthropic_version: BedrockRequest.ANTHROPIC_VERSION,
		max_tokens: BedrockRequest.MAX_TOKENS,
		messages: [{ content: toOutlinePrompt(request), role: "user" }],
		system: OUTLINE_SYSTEM_PROMPT,
		temperature: ExtractionBedrockConfig.TEMPERATURE,
	});

	try {
		const response = await sendBedrockRequest(
			new InvokeModelCommand({
				accept: "application/json",
				body,
				contentType: "application/json",
				modelId: ClaudeModelId.SONNET_4_6,
			}),
		);

		return toResponseText(response.body.transformToString());
	} catch (error) {
		logger.error("Failed to invoke section outline.", { error });

		throw error;
	}
};

export { invokeOutline };
