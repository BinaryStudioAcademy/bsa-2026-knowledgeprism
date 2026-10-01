import { logger } from "~/logger/logger.js";

import { EmbeddingInputType } from "../../embeddings/libs/constants/embedding-input-type.constant.js";
import { type EmbeddingCandidate } from "../../embeddings/libs/types/embedding-candidate.type.js";
import { type SimilarityMatch } from "../../embeddings/libs/types/similarity-match.type.js";
import { embed, search } from "../../embeddings/services/embedding.service.js";
import { createAutoNewResult } from "../libs/helpers/create-auto-new-result.helper.js";
import { filterRelevantMatches } from "../libs/helpers/filter-relevant-matches.helper.js";
import { invokeClassification } from "../libs/helpers/invoke-classification.helper.js";
import { mapClassificationOutput } from "../libs/helpers/map-classification-output.helper.js";
import { type IntegrationAnalysisParameters } from "../libs/types/integration-analysis-parameters.type.js";
import { type IntegrationAnalysisResult } from "../libs/types/integration-analysis-result.type.js";

const EMPTY_COUNT = 0;
const FIRST_VECTOR_INDEX = 0;

const findRelevantMatches = async <T>(
	candidates: EmbeddingCandidate<T>[],
	itemText: string,
): Promise<SimilarityMatch<T>[]> => {
	const itemVectors = await embed(
		[itemText],
		EmbeddingInputType.SEARCH_DOCUMENT,
	);
	const itemVector = itemVectors[FIRST_VECTOR_INDEX];

	if (itemVector === undefined) {
		throw new Error(
			"Embedding service returned no vector for the knowledge item",
		);
	}

	return filterRelevantMatches(
		search({
			candidates,
			queryVector: itemVector,
		}),
	);
};

const analyze = async <T>(
	parameters: IntegrationAnalysisParameters<T>,
): Promise<IntegrationAnalysisResult<T>> => {
	const {
		candidates,
		documents = [],
		itemText,
		priorPlacements = [],
	} = parameters;

	if (itemText.trim() === "") {
		throw new Error("Cannot analyze an empty knowledge item");
	}

	const hasPlaces =
		documents.length > EMPTY_COUNT || priorPlacements.length > EMPTY_COUNT;

	if (!hasPlaces && candidates.length === EMPTY_COUNT) {
		logger.info(
			"No existing knowledge base candidates; proposing NEW without classification",
		);

		return createAutoNewResult();
	}

	const relevant =
		candidates.length === EMPTY_COUNT
			? []
			: await findRelevantMatches(candidates, itemText);

	if (!hasPlaces && relevant.length === EMPTY_COUNT) {
		logger.info(
			"No candidate cleared the similarity threshold; proposing NEW without classification",
		);

		return createAutoNewResult();
	}

	const candidateTexts = relevant.map((match) => {
		return JSON.stringify(match.item);
	});
	const raw = await invokeClassification({
		candidateTexts,
		itemText,
		priorPlacements,
		tree: documents,
	});
	const result = mapClassificationOutput(raw, relevant);

	if (result === null) {
		throw new Error("Claude classification response could not be parsed");
	}

	return result;
};

export { analyze };
