import { type SimilarityMatch } from "../../../embeddings/libs/types/types.js";
import { GlossaryConsistencyThreshold } from "../constants/glossary-consistency-threshold.constant.js";
import { type GlossaryConsistencyTerm } from "../types/types.js";

const filterRelevantTerms = (
	matches: SimilarityMatch<GlossaryConsistencyTerm>[],
): SimilarityMatch<GlossaryConsistencyTerm>[] => {
	return matches.filter((match) => {
		return match.score >= GlossaryConsistencyThreshold.MINIMUM;
	});
};

export { filterRelevantTerms };
