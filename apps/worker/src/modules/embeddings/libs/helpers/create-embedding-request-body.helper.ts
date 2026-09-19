import { EmbeddingRequest } from "../constants/embedding-request.constant.js";
import { type EmbeddingInputTypeValue } from "../types/embedding-input-type-value.type.js";

const createEmbeddingRequestBody = (
	texts: string[],
	inputType: EmbeddingInputTypeValue,
): string => {
	const requestBody = {
		input_type: inputType,
		texts,
		truncate: EmbeddingRequest.TRUNCATE,
	};

	return JSON.stringify(requestBody);
};

export { createEmbeddingRequestBody };
