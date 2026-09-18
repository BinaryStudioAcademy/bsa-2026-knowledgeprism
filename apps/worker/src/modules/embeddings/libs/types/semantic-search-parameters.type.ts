import { type EmbeddingCandidate } from "./embedding-candidate.type.js";
import { type EmbeddingVector } from "./embedding-vector.type.js";

type SemanticSearchParameters<T> = {
	candidates: EmbeddingCandidate<T>[];
	queryVector: EmbeddingVector;
	topK?: number;
};

export { type SemanticSearchParameters };
