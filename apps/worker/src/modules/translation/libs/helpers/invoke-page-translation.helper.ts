import { InvokeModelCommand } from "@aws-sdk/client-bedrock-runtime";
import { BedrockRequest, ClaudeModelId } from "@knowledgeprism/constants";

import { ExtractionBedrockConfig } from "~/bedrock/bedrock-request.constant.js";
import { bedrockRuntimeClient } from "~/bedrock/bedrock.js";
import { toResponseText } from "~/bedrock/to-response-text.helper.js";

import {
	PAGE_CONTENT_TAG,
	TRANSLATION_SYSTEM_PROMPT,
} from "../constants/translation-prompt.constant.js";

const toPagePrompt = (content: string): string => {
	return `<${PAGE_CONTENT_TAG}>\n${content}\n</${PAGE_CONTENT_TAG}>`;
};

const invokePageTranslation = async (content: string): Promise<string> => {
	const body = JSON.stringify({
		anthropic_version: BedrockRequest.ANTHROPIC_VERSION,
		max_tokens: BedrockRequest.MAX_TOKENS,
		messages: [
			{
				content: toPagePrompt(content),
				role: "user",
			},
		],
		system: TRANSLATION_SYSTEM_PROMPT,
		temperature: ExtractionBedrockConfig.TEMPERATURE,
	});

	const response = await bedrockRuntimeClient.send(
		new InvokeModelCommand({
			accept: "application/json",
			body,
			contentType: "application/json",
			modelId: ClaudeModelId.SONNET_4_6,
		}),
	);

	return toResponseText(response.body.transformToString());
};

export { invokePageTranslation };
