import { InvokeModelCommand } from "@aws-sdk/client-bedrock-runtime";
import { BedrockRequest, ClaudeModelId } from "@knowledgeprism/constants";

import { ExtractionBedrockConfig } from "~/bedrock/bedrock-request.constant.js";
import { extractionBedrockRuntimeClient } from "~/bedrock/bedrock.js";
import { sendBedrockRequest } from "~/bedrock/send-bedrock-request.helper.js";
import { toResponseText } from "~/bedrock/to-response-text.helper.js";

import { NODE_MERGE_OUTPUT_SCHEMA } from "../constants/node-merge-output-schema.constant.js";
import { NODE_MERGE_SYSTEM_PROMPT } from "../constants/node-merge-prompt.constant.js";
import { type NodeMergeParameters } from "../types/types.js";

const toNodeMergeUserMessage = ({
	existingBlocks,
	incomingBlocks,
	title,
}: NodeMergeParameters): string => {
	return [
		`<title>${title}</title>`,
		`<existing_blocks>${JSON.stringify(existingBlocks)}</existing_blocks>`,
		`<incoming_blocks>${JSON.stringify(incomingBlocks)}</incoming_blocks>`,
	].join("\n");
};

const invokeNodeMerge = async (
	parameters: NodeMergeParameters,
): Promise<string> => {
	const body = JSON.stringify({
		anthropic_version: BedrockRequest.ANTHROPIC_VERSION,
		max_tokens: ExtractionBedrockConfig.MAX_TOKENS,
		messages: [{ content: toNodeMergeUserMessage(parameters), role: "user" }],
		output_config: {
			format: { schema: NODE_MERGE_OUTPUT_SCHEMA, type: "json_schema" },
		},
		system: NODE_MERGE_SYSTEM_PROMPT,
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

export { invokeNodeMerge };
