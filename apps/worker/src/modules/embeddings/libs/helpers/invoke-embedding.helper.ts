import { InvokeModelCommand } from "@aws-sdk/client-bedrock-runtime";

import { bedrockRuntimeClient } from "~/bedrock/bedrock.js";

import { CohereEmbeddingModel } from "../constants/cohere-embedding-model.constant.js";
import { type EmbeddingInputTypeValue } from "../types/embedding-input-type-value.type.js";
import { type EmbeddingVector } from "../types/embedding-vector.type.js";
import { createEmbeddingRequestBody } from "./create-embedding-request-body.helper.js";
import { parseEmbeddingResponse } from "./parse-embedding-response.helper.js";

const invokeEmbedding = async (
	texts: string[],
	inputType: EmbeddingInputTypeValue,
): Promise<EmbeddingVector[]> => {
	const command = new InvokeModelCommand({
		accept: "application/json",
		body: createEmbeddingRequestBody(texts, inputType),
		contentType: "application/json",
		modelId: CohereEmbeddingModel.ID,
	});

	const response = await bedrockRuntimeClient.send(command);

	const responseText = response.body.transformToString();

	const responseJson: unknown = JSON.parse(responseText);

	const vectors = parseEmbeddingResponse(responseJson);

	if (vectors.length !== texts.length) {
		throw new Error(
			`Unexpected Cohere response: expected ${texts.length.toString()} vectors for ${texts.length.toString()} texts, got ${vectors.length.toString()}`,
		);
	}

	return vectors;
};

export { invokeEmbedding };
