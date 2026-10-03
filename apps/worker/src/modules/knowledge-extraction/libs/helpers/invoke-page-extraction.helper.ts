import { InvokeModelCommand } from "@aws-sdk/client-bedrock-runtime";
import { BedrockRequest, ClaudeModelId } from "@knowledgeprism/constants";

import { ExtractionBedrockConfig } from "~/bedrock/bedrock-request.constant.js";
import { extractionBedrockRuntimeClient } from "~/bedrock/bedrock.js";
import { sendBedrockRequest } from "~/bedrock/send-bedrock-request.helper.js";
import { toResponseText } from "~/bedrock/to-response-text.helper.js";

import { EXTRACTION_OUTPUT_SCHEMA } from "../constants/extraction-output-schema.constant.js";
import { EXTRACTION_SYSTEM_PROMPT } from "../constants/extraction-prompt.constant.js";
import { toExtractionUserMessage } from "./to-extraction-user-message.helper.js";

const invokePageExtraction = async (
	content: string,
	previousHeading?: null | string,
	feedback?: null | string,
): Promise<unknown> => {
	const body = JSON.stringify({
		anthropic_version: BedrockRequest.ANTHROPIC_VERSION,
		max_tokens: ExtractionBedrockConfig.MAX_TOKENS,
		messages: [
			{
				content: toExtractionUserMessage(
					content,
					previousHeading ?? null,
					feedback ?? null,
				),
				role: "user",
			},
		],
		output_config: {
			format: { schema: EXTRACTION_OUTPUT_SCHEMA, type: "json_schema" },
		},
		system: EXTRACTION_SYSTEM_PROMPT,
		temperature: ExtractionBedrockConfig.TEMPERATURE,
	});

	const response = await sendBedrockRequest(
		new InvokeModelCommand({
			accept: "application/json",
			body,
			contentType: "application/json",
			modelId: ClaudeModelId.SONNET_4_6,
		}),
		extractionBedrockRuntimeClient,
	);

	return toResponseText(response.body.transformToString());
};

export { invokePageExtraction };
