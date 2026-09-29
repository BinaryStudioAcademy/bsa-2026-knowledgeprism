import { InvokeModelCommand } from "@aws-sdk/client-bedrock-runtime";
import { BedrockRequest, ClaudeModelId } from "@knowledgeprism/constants";
import { toResponseText } from "@knowledgeprism/worker";

import { bedrockRuntimeClient } from "~/infrastructure/bedrock/bedrock.js";

import { RagBedrockRequest } from "../constants/rag-bedrock-request.constant.js";
import {
	RAG_SYSTEM_PROMPT,
	toRagPrompt,
} from "../constants/rag-prompt.constant.js";

const invokeRagGeneration = async (
	question: string,
	contextChunks: string[],
): Promise<string> => {
	const body = JSON.stringify({
		anthropic_version: BedrockRequest.ANTHROPIC_VERSION,
		max_tokens: BedrockRequest.MAX_TOKENS,
		messages: [{ content: toRagPrompt(question, contextChunks), role: "user" }],
		system: RAG_SYSTEM_PROMPT,
		temperature: RagBedrockRequest.TEMPERATURE,
	});

	const command = new InvokeModelCommand({
		accept: "application/json",
		body,
		contentType: "application/json",
		modelId: ClaudeModelId.SONNET_4_6,
	});

	const response = await bedrockRuntimeClient.send(command);
	const textResponse = toResponseText(response.body.transformToString());

	if (!textResponse) {
		throw new Error("Invalid response from Claude: Missing content text");
	}

	return textResponse;
};

export { invokeRagGeneration };
