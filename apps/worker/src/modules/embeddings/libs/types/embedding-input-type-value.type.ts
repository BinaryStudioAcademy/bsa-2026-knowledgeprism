import { EmbeddingInputType } from "../constants/embedding-input-type.constant.js";

type EmbeddingInputTypeValue =
	(typeof EmbeddingInputType)[keyof typeof EmbeddingInputType];

export { type EmbeddingInputTypeValue };
