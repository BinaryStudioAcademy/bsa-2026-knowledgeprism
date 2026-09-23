import { type SimilarityMatch } from "../../../embeddings/libs/types/similarity-match.type.js";
import { SimilarityThreshold } from "../constants/similarity-threshold.constant.js";

const filterRelevantMatches = <T>(
	matches: SimilarityMatch<T>[],
): SimilarityMatch<T>[] => {
	return matches.filter((match) => {
		return match.score >= SimilarityThreshold.MINIMUM;
	});
};

export { filterRelevantMatches };
