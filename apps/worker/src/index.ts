export { bedrockRuntimeClient } from "./bedrock/bedrock.js";
export { logger } from "./logger/logger.js";
export { EmbeddingInputType } from "./modules/embeddings/libs/constants/embedding-input-type.constant.js";

export {
	type EmbeddingCandidate,
	type EmbeddingInputTypeValue,
	type EmbeddingVector,
	type SemanticSearchParameters,
	type SimilarityMatch,
} from "./modules/embeddings/libs/types/types.js";
export {
	embed,
	search,
} from "./modules/embeddings/services/embedding.service.js";
export { type IntegrationAnalysisParameters } from "./modules/integration-analysis/libs/types/integration-analysis-parameters.type.js";
export { type IntegrationAnalysisResult } from "./modules/integration-analysis/libs/types/integration-analysis-result.type.js";
export { type IntegrationChangeTypeValue } from "./modules/integration-analysis/libs/types/integration-change-type-value.type.js";
export { analyze } from "./modules/integration-analysis/services/integration-analysis.service.js";
export { downloadDocument } from "./modules/knowledge-extraction/libs/helpers/download-document.helper.js";
export { type ExtractionBlock } from "./modules/knowledge-extraction/libs/types/extraction-block.type.js";
export { type KnowledgeItem } from "./modules/knowledge-extraction/libs/types/knowledge-item.type.js";
export { extract } from "./modules/knowledge-extraction/services/knowledge-extraction.service.js";
export { type ParsedPageBlock } from "./parsers/libs/types/parsed-page-block.type.js";
export { parseDocument } from "./parsers/parse-document.js";
