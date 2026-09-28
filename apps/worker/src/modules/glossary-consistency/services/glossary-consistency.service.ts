import { EmbeddingInputType } from "../../embeddings/libs/constants/embedding-input-type.constant.js";
import { type EmbeddingCandidate } from "../../embeddings/libs/types/types.js";
import { embed, search } from "../../embeddings/services/embedding.service.js";
import { filterRelevantTerms } from "../libs/helpers/filter-relevant-terms.helper.js";
import { invokeConsistencyCheck } from "../libs/helpers/invoke-consistency-check.helper.js";
import { mapConsistencyOutput } from "../libs/helpers/map-consistency-output.helper.js";
import { splitIntoSentences } from "../libs/helpers/split-into-sentences.helper.js";
import {
	type GlossaryConsistencyMatch,
	type GlossaryConsistencyTerm,
} from "../libs/types/types.js";

const EMPTY_COUNT = 0;

// Each term's vector is computed once, on create/update, and cached by the caller —
// building candidates here is a pure in-memory reshape, no embedding call per check.
const toTermCandidates = (
	terms: GlossaryConsistencyTerm[],
): EmbeddingCandidate<GlossaryConsistencyTerm>[] =>
	terms.map((term) => ({ item: term, vector: term.embedding }));

// One embedding of the whole content dilutes the signal: a single unrelated sentence
// elsewhere in the text pulls the score down below any real term match. Embedding
// sentence-by-sentence instead, and keeping the union of terms any sentence matched,
// keeps each comparison specific.
const findRelevantTerms = async (
	content: string,
	candidates: EmbeddingCandidate<GlossaryConsistencyTerm>[],
): Promise<GlossaryConsistencyTerm[]> => {
	const sentences = splitIntoSentences(content);

	if (sentences.length === EMPTY_COUNT) {
		return [];
	}

	const sentenceVectors = await embed(
		sentences,
		EmbeddingInputType.SEARCH_DOCUMENT,
	);

	const relevantTermsById = new Map<number, GlossaryConsistencyTerm>();

	for (const sentenceVector of sentenceVectors) {
		const matches = search({
			candidates,
			queryVector: sentenceVector,
			topK: candidates.length,
		});

		for (const match of filterRelevantTerms(matches)) {
			relevantTermsById.set(match.item.id, match.item);
		}
	}

	return relevantTermsById.values().toArray();
};

const checkGlossaryConsistency = async ({
	content,
	terms,
}: {
	content: string;
	terms: GlossaryConsistencyTerm[];
}): Promise<GlossaryConsistencyMatch[]> => {
	if (terms.length === EMPTY_COUNT || content.trim() === "") {
		return [];
	}

	const candidates = toTermCandidates(terms);
	const relevantTerms = await findRelevantTerms(content, candidates);

	if (relevantTerms.length === EMPTY_COUNT) {
		return [];
	}

	const raw = await invokeConsistencyCheck(content, relevantTerms);
	const result = mapConsistencyOutput(raw, content, relevantTerms);

	if (result === null) {
		throw new Error("Claude glossary consistency response could not be parsed");
	}

	return result;
};

export { checkGlossaryConsistency };
