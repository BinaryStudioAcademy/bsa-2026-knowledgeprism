import { logger } from "~/logger/logger.js";

import { EmbeddingRequest } from "../libs/constants/embedding-request.constant.js";
import { SemanticSearchDefault } from "../libs/constants/semantic-search-default.constant.js";
import { calculateCosineSimilarity } from "../libs/helpers/calculate-cosine-similarity.helper.js";
import { invokeEmbedding } from "../libs/helpers/invoke-embedding.helper.js";
import { splitIntoBatches } from "../libs/helpers/split-into-batches.helper.js";
import { type EmbeddingInputTypeValue } from "../libs/types/embedding-input-type-value.type.js";
import { type EmbeddingVector } from "../libs/types/embedding-vector.type.js";
import { type SemanticSearchParameters } from "../libs/types/semantic-search-parameters.type.js";
import { type SimilarityMatch } from "../libs/types/similarity-match.type.js";

const EMPTY_TEXTS_COUNT = 0;
const FIRST_CHARACTER_INDEX = 0;
const NOT_FOUND_INDEX = -1;
const FIRST_MATCH_INDEX = 0;
const MIN_TOP_K = 1;

const embed = async (
	texts: string[],
	inputType: EmbeddingInputTypeValue,
	{ isLimited = true }: { isLimited?: boolean } = {},
): Promise<EmbeddingVector[]> => {
	if (texts.length === EMPTY_TEXTS_COUNT) {
		return [];
	}

	const emptyTextIndex = texts.findIndex((text) => text.trim() === "");

	if (emptyTextIndex !== NOT_FOUND_INDEX) {
		throw new Error(
			`Cannot embed an empty text at index ${emptyTextIndex.toString()}`,
		);
	}

	const limitedTexts = texts.map((text) =>
		text.slice(FIRST_CHARACTER_INDEX, EmbeddingRequest.MAX_TEXT_LENGTH),
	);
	const batches = splitIntoBatches(
		limitedTexts,
		EmbeddingRequest.MAX_TEXTS_PER_REQUEST,
	);

	const vectors: EmbeddingVector[] = [];

	for (const batch of batches) {
		const batchVectors = await invokeEmbedding(batch, inputType, isLimited);
		vectors.push(...batchVectors);
	}

	logger.info(
		`Embedded ${texts.length.toString()} texts in ${batches.length.toString()} batches`,
	);

	return vectors;
};

const search = <T>(
	parameters: SemanticSearchParameters<T>,
): SimilarityMatch<T>[] => {
	const {
		candidates,
		queryVector,
		topK = SemanticSearchDefault.TOP_K,
	} = parameters;

	if (!Number.isSafeInteger(topK) || topK < MIN_TOP_K) {
		throw new Error(`Top K must be a positive integer, got ${topK.toString()}`);
	}

	const matches = candidates.map((candidate) => {
		return {
			item: candidate.item,
			score: calculateCosineSimilarity(queryVector, candidate.vector),
		};
	});

	const sortedMatches = matches.toSorted((firstMatch, secondMatch) => {
		return secondMatch.score - firstMatch.score;
	});

	return sortedMatches.slice(FIRST_MATCH_INDEX, topK);
};

export { embed, search };
