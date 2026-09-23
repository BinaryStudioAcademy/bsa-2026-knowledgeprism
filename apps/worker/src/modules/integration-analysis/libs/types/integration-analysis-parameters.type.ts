import { type EmbeddingCandidate } from "../../../embeddings/libs/types/embedding-candidate.type.js";

type IntegrationAnalysisParameters<T> = {
	candidates: EmbeddingCandidate<T>[];
	itemText: string;
};

export { type IntegrationAnalysisParameters };
