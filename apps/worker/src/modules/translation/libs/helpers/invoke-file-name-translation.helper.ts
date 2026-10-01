import { InvokeModelCommand } from "@aws-sdk/client-bedrock-runtime";
import { BedrockRequest, ClaudeModelId } from "@knowledgeprism/constants";

import { ExtractionBedrockConfig } from "~/bedrock/bedrock-request.constant.js";
import { bedrockRuntimeClient } from "~/bedrock/bedrock.js";
import { toResponseText } from "~/bedrock/to-response-text.helper.js";
import {
	FILE_NAME_TAG,
	FILE_NAME_TRANSLATION_SYSTEM_PROMPT,
} from "../constants/file-name-translation-prompt.constant.js";

const toFileNamePrompt = (content: string): string => {
	return `<${FILE_NAME_TAG}>\n${content}\n</${FILE_NAME_TAG}>`;
};

const invokeFileNameTranslation = async (content: string): Promise<string> => {
	const body = JSON.stringify({
		anthropic_version: BedrockRequest.ANTHROPIC_VERSION,
		max_tokens: BedrockRequest.MAX_TOKENS,
		messages: [
			{
				content: toFileNamePrompt(content),
				role: "user",
			},
		],
		system: FILE_NAME_TRANSLATION_SYSTEM_PROMPT,
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

export { invokeFileNameTranslation };
