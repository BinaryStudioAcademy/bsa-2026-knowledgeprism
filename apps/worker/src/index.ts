export { bedrockRuntimeClient } from "./bedrock/bedrock.js";
export { logger } from "./logger/logger.js";
export { EmbeddingInputType } from "./modules/embeddings/libs/constants/embedding-input-type.constant.js";
export { createEmbeddingRequestBody } from "./modules/embeddings/libs/helpers/create-embedding-request-body.helper.js";
export { parseEmbeddingResponse } from "./modules/embeddings/libs/helpers/parse-embedding-response.helper.js";
export {
	type EmbeddingInputTypeValue,
	type EmbeddingVector,
} from "./modules/embeddings/libs/types/types.js";
export { downloadDocument } from "./modules/knowledge-extraction/libs/helpers/download-document.helper.js";
export { type KnowledgeItem } from "./modules/knowledge-extraction/libs/types/types.js";
export { extract } from "./modules/knowledge-extraction/services/knowledge-extraction.service.js";
