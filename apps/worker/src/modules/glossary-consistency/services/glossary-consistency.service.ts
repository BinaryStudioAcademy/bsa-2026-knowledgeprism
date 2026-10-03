import { mapWithConcurrency } from "@knowledgeprism/config";

import { EmbeddingInputType } from "../../embeddings/libs/constants/embedding-input-type.constant.js";
import { type EmbeddingCandidate } from "../../embeddings/libs/types/types.js";
import { embed, search } from "../../embeddings/services/embedding.service.js";
import { splitIntoChunks } from "../../knowledge-extraction/libs/helpers/split-into-chunks.helper.js";
import { GlossaryConsistencyCheck } from "../libs/constants/glossary-consistency-check.constant.js";
import { dropGlossaryTermNames } from "../libs/helpers/drop-glossary-term-names.helper.js";
import { filterRelevantTerms } from "../libs/helpers/filter-relevant-terms.helper.js";
import { findSpelledOutTerms } from "../libs/helpers/find-spelled-out-terms.helper.js";
import { invokeConsistencyCheck } from "../libs/helpers/invoke-consistency-check.helper.js";
import { mapConsistencyOutput } from "../libs/helpers/map-consistency-output.helper.js";
import { splitIntoSentences } from "../libs/helpers/split-into-sentences.helper.js";
import { toUniqueMatches } from "../libs/helpers/to-unique-matches.helper.js";
import {
	type GlossaryConsistencyMatch,
	type GlossaryConsistencyTerm,
} from "../libs/types/types.js";

const EMPTY_COUNT = 0;

const toTermCandidates = (
	terms: GlossaryConsistencyTerm[],
): EmbeddingCandidate<GlossaryConsistencyTerm>[] =>
	terms.map((term) => ({ item: term, vector: term.embedding }));

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

const checkPart = async ({
	candidates,
	part,
	terms,
}: {
	candidates: EmbeddingCandidate<GlossaryConsistencyTerm>[];
	part: string;
	terms: GlossaryConsistencyTerm[];
}): Promise<GlossaryConsistencyMatch[]> => {
	const relevantTermsById = new Map(
		[
			...findSpelledOutTerms(part, terms),
			...(await findRelevantTerms(part, candidates)),
		].map((term) => [term.id, term]),
	);
	const relevantTerms = relevantTermsById.values().toArray();

	if (relevantTerms.length === EMPTY_COUNT) {
		return [];
	}

	const raw = await invokeConsistencyCheck(part, relevantTerms);
	const result = mapConsistencyOutput(raw, part, relevantTerms);

	if (result === null) {
		throw new Error("Claude glossary consistency response could not be parsed");
	}

	return result;
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
	const parts = splitIntoChunks(
		content,
		GlossaryConsistencyCheck.PART_MAXIMUM_LENGTH,
	);
	const partMatches = await mapWithConcurrency(
		parts,
		GlossaryConsistencyCheck.MAXIMUM_CONCURRENT_PARTS,
		(part) => checkPart({ candidates, part, terms }),
	);

	return dropGlossaryTermNames(
		toUniqueMatches(partMatches.flat(), content),
		terms,
	);
};

export { checkGlossaryConsistency };
