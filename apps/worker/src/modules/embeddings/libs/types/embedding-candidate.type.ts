import { type EmbeddingVector } from "./embedding-vector.type.js";

type EmbeddingCandidate<T> = {
	item: T;
	vector: EmbeddingVector;
};

export { type EmbeddingCandidate };
