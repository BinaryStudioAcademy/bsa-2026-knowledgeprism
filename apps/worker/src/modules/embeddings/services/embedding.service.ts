import { logger } from "~/logger/logger.js";

import { EmbeddingRequest } from "../libs/constants/embedding-request.constant.js";
import { invokeEmbedding } from "../libs/helpers/invoke-embedding.helper.js";
import { splitIntoBatches } from "../libs/helpers/split-into-batches.helper.js";
import { type EmbeddingInputTypeValue } from "../libs/types/embedding-input-type-value.type.js";
import { type EmbeddingVector } from "../libs/types/embedding-vector.type.js";

const EMPTY_TEXTS_COUNT = 0;
const NOT_FOUND_INDEX = -1;

const embed = async (
	texts: string[],
	inputType: EmbeddingInputTypeValue,
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

	for (const [index, text] of texts.entries()) {
		if (text.length > EmbeddingRequest.MAX_TEXT_LENGTH) {
			logger.warn(
				`Text at index ${index.toString()} is ${text.length.toString()} characters long, over the ${EmbeddingRequest.MAX_TEXT_LENGTH.toString()} limit. Cohere will truncate it`,
			);
		}
	}

	const batches = splitIntoBatches(
		texts,
		EmbeddingRequest.MAX_TEXTS_PER_REQUEST,
	);

	const vectors: EmbeddingVector[] = [];

	for (const batch of batches) {
		const batchVectors = await invokeEmbedding(batch, inputType);
		vectors.push(...batchVectors);
	}

	logger.info(
		`Embedded ${texts.length.toString()} texts in ${batches.length.toString()} batches`,
	);

	return vectors;
};

export { embed };
