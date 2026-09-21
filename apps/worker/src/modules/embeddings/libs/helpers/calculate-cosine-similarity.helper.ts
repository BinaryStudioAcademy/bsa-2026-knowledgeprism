import { type EmbeddingVector } from "../types/embedding-vector.type.js";

const INITIAL_SUM = 0;
const ZERO_MAGNITUDE = 0;

const calculateCosineSimilarity = (
	firstVector: EmbeddingVector,
	secondVector: EmbeddingVector,
): number => {
	if (firstVector.length !== secondVector.length) {
		throw new Error(
			`Cannot compare vectors of different lengths: ${firstVector.length.toString()} and ${secondVector.length.toString()}`,
		);
	}

	let scalarProduct = INITIAL_SUM;
	let firstVectorSquaredSum = INITIAL_SUM;
	let secondVectorSquaredSum = INITIAL_SUM;

	for (const [index, firstValue] of firstVector.entries()) {
		const secondValue = secondVector[index];

		if (secondValue === undefined) {
			throw new Error(
				`Missing value in the second vector at index ${index.toString()}`,
			);
		}

		firstVectorSquaredSum += firstValue * firstValue;
		secondVectorSquaredSum += secondValue * secondValue;
		scalarProduct += firstValue * secondValue;
	}

	const magnitudeProduct = Math.sqrt(
		firstVectorSquaredSum * secondVectorSquaredSum,
	);

	if (magnitudeProduct === ZERO_MAGNITUDE) {
		return ZERO_MAGNITUDE;
	}

	const cosineSimilarity = scalarProduct / magnitudeProduct;

	return cosineSimilarity;
};

export { calculateCosineSimilarity };
