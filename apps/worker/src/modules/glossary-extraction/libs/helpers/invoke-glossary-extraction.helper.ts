import { InvokeModelCommand } from "@aws-sdk/client-bedrock-runtime";
import { BedrockRequest, ClaudeModelId } from "@knowledgeprism/constants";

import { ExtractionBedrockConfig } from "~/bedrock/bedrock-request.constant.js";
import { bedrockRuntimeClient } from "~/bedrock/bedrock.js";
import { toResponseText } from "~/bedrock/to-response-text.helper.js";

import {
	CONTENT_TAG,
	EXISTING_TERMS_TAG,
	GLOSSARY_EXTRACTION_SYSTEM_PROMPT,
} from "../constants/glossary-extraction.constant.js";

const toGlossaryExtractionPrompt = (
	content: string,
	existingNames: readonly string[],
): string =>
	`<${CONTENT_TAG}>\n${content}\n</${CONTENT_TAG}>\n<${EXISTING_TERMS_TAG}>\n${existingNames.join("\n")}\n</${EXISTING_TERMS_TAG}>`;

const invokeGlossaryExtraction = async (
	content: string,
	existingNames: readonly string[],
): Promise<unknown> => {
	const body = JSON.stringify({
		anthropic_version: BedrockRequest.ANTHROPIC_VERSION,
		max_tokens: BedrockRequest.MAX_TOKENS,
		messages: [
			{
				content: toGlossaryExtractionPrompt(content, existingNames),
				role: "user",
			},
		],
		system: GLOSSARY_EXTRACTION_SYSTEM_PROMPT,
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

export { invokeGlossaryExtraction };
