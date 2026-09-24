import { InvokeModelCommand } from "@aws-sdk/client-bedrock-runtime";
import { BedrockRequest, ClaudeModelId } from "@knowledgeprism/constants";

import { ExtractionBedrockConfig } from "~/bedrock/bedrock-request.constant.js";
import { bedrockRuntimeClient } from "~/bedrock/bedrock.js";
import { toResponseText } from "~/bedrock/to-response-text.helper.js";
import { logger } from "~/logger/logger.js";

import {
	CANDIDATES_TAG,
	CLASSIFICATION_SYSTEM_PROMPT,
	ITEM_TAG,
} from "../constants/classification-prompt.constant.js";

const toCandidateLines = (candidateTexts: string[]): string => {
	return candidateTexts
		.map((text, index) => {
			return `${index.toString()}: ${text}`;
		})
		.join("\n");
};

const toClassificationPrompt = (
	itemText: string,
	candidateTexts: string[],
): string => {
	return `<${ITEM_TAG}>\n${itemText}\n</${ITEM_TAG}>\n<${CANDIDATES_TAG}>\n${toCandidateLines(candidateTexts)}\n</${CANDIDATES_TAG}>`;
};

const invokeClassification = async (
	itemText: string,
	candidateTexts: string[],
): Promise<unknown> => {
	const body = JSON.stringify({
		anthropic_version: BedrockRequest.ANTHROPIC_VERSION,
		max_tokens: BedrockRequest.MAX_TOKENS,
		messages: [
			{
				content: toClassificationPrompt(itemText, candidateTexts),
				role: "user",
			},
		],
		system: CLASSIFICATION_SYSTEM_PROMPT,
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
		logger.error("Failed to invoke integration classification.", { error });

		throw error;
	}
};

export { invokeClassification };
