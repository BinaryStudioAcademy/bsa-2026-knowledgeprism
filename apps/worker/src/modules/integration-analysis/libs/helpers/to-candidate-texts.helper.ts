import { type SimilarityMatch } from "../../../embeddings/libs/types/similarity-match.type.js";

const toCandidateTexts = <T>(matches: SimilarityMatch<T>[]): string[] => {
	return matches.map((match) => JSON.stringify(match.item));
};

export { toCandidateTexts };
