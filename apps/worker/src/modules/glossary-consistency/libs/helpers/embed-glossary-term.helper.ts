import { EmbeddingInputType } from "../../../embeddings/libs/constants/embedding-input-type.constant.js";
import { type EmbeddingVector } from "../../../embeddings/libs/types/types.js";
import { embed } from "../../../embeddings/services/embedding.service.js";

const FIRST_VECTOR_INDEX = 0;

const toTermText = ({
	definition,
	name,
}: {
	definition: string;
	name: string;
}): string => `${name}: ${definition}`;

// Embedded once here (create/update) and cached on the term row, instead of
// re-embedding every glossary term on every check-consistency call.
const embedGlossaryTerm = async (term: {
	definition: string;
	name: string;
}): Promise<EmbeddingVector> => {
	const vectors = await embed(
		[toTermText(term)],
		EmbeddingInputType.SEARCH_DOCUMENT,
	);
	const vector = vectors[FIRST_VECTOR_INDEX];

	if (vector === undefined) {
		throw new Error("Embedding service returned no vector for glossary term");
	}

	return vector;
};

export { embedGlossaryTerm };
