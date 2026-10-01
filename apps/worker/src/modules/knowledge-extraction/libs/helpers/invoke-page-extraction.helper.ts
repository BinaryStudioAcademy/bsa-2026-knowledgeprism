import { InvokeModelCommand } from "@aws-sdk/client-bedrock-runtime";
import { BedrockRequest, ClaudeModelId } from "@knowledgeprism/constants";

import { ExtractionBedrockConfig } from "~/bedrock/bedrock-request.constant.js";
import { bedrockRuntimeClient } from "~/bedrock/bedrock.js";
import { toResponseText } from "~/bedrock/to-response-text.helper.js";

import { EXTRACTION_OUTPUT_SCHEMA } from "../constants/extraction-output-schema.constant.js";
import { EXTRACTION_SYSTEM_PROMPT } from "../constants/extraction-prompt.constant.js";
import { toExtractionUserMessage } from "./to-extraction-user-message.helper.js";

const invokePageExtraction = async (
	content: string,
	previousHeading?: null | string,
): Promise<unknown> => {
	const body = JSON.stringify({
		anthropic_version: BedrockRequest.ANTHROPIC_VERSION,
		max_tokens: BedrockRequest.MAX_TOKENS,
		messages: [
			{
				content: toExtractionUserMessage(content, previousHeading ?? null),
				role: "user",
			},
		],
		output_config: {
			format: { schema: EXTRACTION_OUTPUT_SCHEMA, type: "json_schema" },
		},
		system: EXTRACTION_SYSTEM_PROMPT,
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

export { invokePageExtraction };
