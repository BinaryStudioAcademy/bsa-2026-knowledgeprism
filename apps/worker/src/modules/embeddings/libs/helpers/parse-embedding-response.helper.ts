import { CohereEmbeddingModel } from "../constants/cohere-embedding-model.constant.js";
import { type EmbeddingVector } from "../types/embedding-vector.type.js";

const isEmbeddingVector = (value: unknown): value is EmbeddingVector => {
	return (
		Array.isArray(value) && value.every((item) => typeof item === "number")
	);
};

const isEmbeddingVectorList = (value: unknown): value is EmbeddingVector[] => {
	return Array.isArray(value) && value.every((item) => isEmbeddingVector(item));
};

const parseEmbeddingResponse = (response: unknown): EmbeddingVector[] => {
	if (response === null || typeof response !== "object") {
		throw new Error("Unexpected Cohere response: response is not an object");
	}

	if (!("embeddings" in response)) {
		throw new Error("Unexpected Cohere response: embeddings field is missing");
	}

	if (!isEmbeddingVectorList(response.embeddings)) {
		throw new Error(
			"Unexpected Cohere response: embeddings must be an array of number arrays",
		);
	}

	const invalidVector = response.embeddings.find(
		(vector) => vector.length !== CohereEmbeddingModel.DIMENSION,
	);

	if (invalidVector) {
		throw new Error(
			`Unexpected Cohere response: expected vectors of length ${CohereEmbeddingModel.DIMENSION.toString()}, got ${invalidVector.length.toString()}`,
		);
	}

	return response.embeddings;
};

export { parseEmbeddingResponse };
