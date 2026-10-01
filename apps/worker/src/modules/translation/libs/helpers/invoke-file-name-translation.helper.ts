import { InvokeModelCommand } from "@aws-sdk/client-bedrock-runtime";
import { BedrockRequest, ClaudeModelId } from "@knowledgeprism/constants";

import { ExtractionBedrockConfig } from "~/bedrock/bedrock-request.constant.js";
import { bedrockRuntimeClient } from "~/bedrock/bedrock.js";
import { toResponseText } from "~/bedrock/to-response-text.helper.js";

const FILE_NAME_TRANSLATION_SYSTEM_PROMPT = `
Translate the provided filename into English.

Rules:
- Return only the translated filename text.
- Do not add explanations, quotes, punctuation, or extra formatting.
- Preserve the original meaning.
- If the filename is already in English, return it unchanged.
- Translate non-English words into natural English when possible.
- Do not return the original non-English script when a clear English translation is possible.
`.trim();

const FILE_NAME_TAG = "file-name";

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
