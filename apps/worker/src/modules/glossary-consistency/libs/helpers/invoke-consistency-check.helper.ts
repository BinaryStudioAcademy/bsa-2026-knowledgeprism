import { InvokeModelCommand } from "@aws-sdk/client-bedrock-runtime";
import { BedrockRequest, ClaudeModelId } from "@knowledgeprism/constants";

import { ExtractionBedrockConfig } from "~/bedrock/bedrock-request.constant.js";
import { bedrockRuntimeClient } from "~/bedrock/bedrock.js";
import { toResponseText } from "~/bedrock/to-response-text.helper.js";
import { logger } from "~/logger/logger.js";

import {
	CONSISTENCY_SYSTEM_PROMPT,
	CONTENT_TAG,
	TERMS_TAG,
} from "../constants/consistency-prompt.constant.js";
import { type GlossaryConsistencyTerm } from "../types/types.js";

const toTermLines = (terms: GlossaryConsistencyTerm[]): string => {
	return terms
		.map((term) => {
			return `${term.id.toString()}: ${term.name}: ${term.definition}`;
		})
		.join("\n");
};

const toConsistencyPrompt = (
	content: string,
	terms: GlossaryConsistencyTerm[],
): string => {
	return `<${CONTENT_TAG}>\n${content}\n</${CONTENT_TAG}>\n<${TERMS_TAG}>\n${toTermLines(terms)}\n</${TERMS_TAG}>`;
};

const invokeConsistencyCheck = async (
	content: string,
	terms: GlossaryConsistencyTerm[],
): Promise<unknown> => {
	const body = JSON.stringify({
		anthropic_version: BedrockRequest.ANTHROPIC_VERSION,
		max_tokens: BedrockRequest.MAX_TOKENS,
		messages: [
			{
				content: toConsistencyPrompt(content, terms),
				role: "user",
			},
		],
		system: CONSISTENCY_SYSTEM_PROMPT,
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
		logger.error("Failed to invoke glossary consistency check.", { error });

		throw error;
	}
};

export { invokeConsistencyCheck };
