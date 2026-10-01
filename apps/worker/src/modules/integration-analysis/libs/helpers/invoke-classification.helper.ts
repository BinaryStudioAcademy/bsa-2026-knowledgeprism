import { InvokeModelCommand } from "@aws-sdk/client-bedrock-runtime";
import { BedrockRequest, ClaudeModelId } from "@knowledgeprism/constants";

import { ExtractionBedrockConfig } from "~/bedrock/bedrock-request.constant.js";
import { bedrockRuntimeClient } from "~/bedrock/bedrock.js";
import { toResponseText } from "~/bedrock/to-response-text.helper.js";
import { logger } from "~/logger/logger.js";

import { CLASSIFICATION_SYSTEM_PROMPT } from "../constants/classification-prompt.constant.js";
import {
	type ClassificationRequest,
	toClassificationPrompt,
} from "./to-classification-prompt.helper.js";

const invokeClassification = async ({
	candidateTexts,
	itemText,
	priorPlacements,
	tree,
}: ClassificationRequest): Promise<unknown> => {
	const body = JSON.stringify({
		anthropic_version: BedrockRequest.ANTHROPIC_VERSION,
		max_tokens: BedrockRequest.MAX_TOKENS,
		messages: [
			{
				content: toClassificationPrompt({
					candidateTexts,
					itemText,
					priorPlacements,
					tree,
				}),
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
