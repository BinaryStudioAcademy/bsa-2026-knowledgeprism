import { type EmbeddingVector } from "../../../embeddings/libs/types/types.js";

type GlossaryConsistencyTerm = {
	definition: string;
	embedding: EmbeddingVector;
	id: number;
	name: string;
};

export { type GlossaryConsistencyTerm };
