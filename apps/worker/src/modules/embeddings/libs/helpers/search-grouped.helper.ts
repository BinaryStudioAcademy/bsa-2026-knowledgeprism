import { SemanticSearchDefault } from "../constants/semantic-search-default.constant.js";
import { type EmbeddingCandidate } from "../types/embedding-candidate.type.js";
import { type EmbeddingVector } from "../types/embedding-vector.type.js";
import { type SimilarityMatch } from "../types/similarity-match.type.js";
import { calculateCosineSimilarity } from "./calculate-cosine-similarity.helper.js";

const FIRST_MATCH_INDEX = 0;
const MIN_TOP_K = 1;

const searchGrouped = <T>({
	candidates,
	queryVectors,
	topK = SemanticSearchDefault.TOP_K,
}: {
	candidates: EmbeddingCandidate<T>[];
	queryVectors: EmbeddingVector[];
	topK?: number;
}): SimilarityMatch<T>[] => {
	if (!Number.isSafeInteger(topK) || topK < MIN_TOP_K) {
		throw new Error(`Top K must be a positive integer, got ${topK.toString()}`);
	}

	const bestScoreByItem = new Map<T, number>();

	for (const { item, vector } of candidates) {
		const score = Math.max(
			...queryVectors.map((queryVector) =>
				calculateCosineSimilarity(queryVector, vector),
			),
		);

		if (score > (bestScoreByItem.get(item) ?? -Infinity)) {
			bestScoreByItem.set(item, score);
		}
	}

	return bestScoreByItem
		.entries()
		.map(([item, score]) => ({ item, score }))
		.toArray()
		.toSorted((first, second) => second.score - first.score)
		.slice(FIRST_MATCH_INDEX, topK);
};

export { searchGrouped };
