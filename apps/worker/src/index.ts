export { BedrockResponseFailure } from "./bedrock/bedrock-response-error.exception.js";
export { bedrockRuntimeClient } from "./bedrock/bedrock.js";
export { toResponseText } from "./bedrock/to-response-text.helper.js";
export { logger } from "./logger/logger.js";
export { type DocumentChunk } from "./modules/document-structure/libs/types/document-chunk.type.js";

export {
	toDocumentChunks,
	withTranslatedSectionTitles,
} from "./modules/document-structure/services/document-structure.service.js";
export { EmbeddingInputType } from "./modules/embeddings/libs/constants/embedding-input-type.constant.js";
export { toEmbeddingEntry } from "./modules/embeddings/libs/helpers/to-embedding-entry.helper.js";
export {
	type EmbeddingCandidate,
	type EmbeddingEntry,
	type EmbeddingInputTypeValue,
	type EmbeddingVector,
	type SemanticSearchParameters,
	type SimilarityMatch,
} from "./modules/embeddings/libs/types/types.js";
export {
	embed,
	embedChunked,
	search,
	searchGrouped,
} from "./modules/embeddings/services/embedding.service.js";
export { embedGlossaryTerm } from "./modules/glossary-consistency/libs/helpers/embed-glossary-term.helper.js";
export {
	type GlossaryConsistencyMatch,
	type GlossaryConsistencyTerm,
} from "./modules/glossary-consistency/libs/types/types.js";
export { checkGlossaryConsistency } from "./modules/glossary-consistency/services/glossary-consistency.service.js";
export { type GlossaryTermCandidate } from "./modules/glossary-extraction/libs/types/types.js";
export { extractGlossaryTerms } from "./modules/glossary-extraction/services/glossary-extraction.service.js";
export { isAutoNewResult } from "./modules/integration-analysis/libs/helpers/is-auto-new-result.helper.js";
export {
	type RecordedSectionPlacement,
	toRecordedSectionPlacement,
} from "./modules/integration-analysis/libs/helpers/to-recorded-section-placement.helper.js";
export {
	type IntegrationAnalysisParameters,
	type PlacementTreeNode,
	type PriorSectionPlacement,
} from "./modules/integration-analysis/libs/types/integration-analysis-parameters.type.js";
export { type IntegrationAnalysisResult } from "./modules/integration-analysis/libs/types/integration-analysis-result.type.js";
export { type IntegrationChangeTypeValue } from "./modules/integration-analysis/libs/types/integration-change-type-value.type.js";
export {
	type OutlineSection,
	type SectionOutline,
} from "./modules/integration-analysis/libs/types/section-outline.type.js";
export { analyze } from "./modules/integration-analysis/services/integration-analysis.service.js";
export { placeSections } from "./modules/integration-analysis/services/section-outline.service.js";
export { downloadDocument } from "./modules/knowledge-extraction/libs/helpers/download-document.helper.js";
export { type ExtractionBlock } from "./modules/knowledge-extraction/libs/types/extraction-block.type.js";
export { type ExtractionResponseRecord } from "./modules/knowledge-extraction/libs/types/extraction-response-record.type.js";
export { type ExtractionResult } from "./modules/knowledge-extraction/libs/types/extraction-result.type.js";
export { type KnowledgeItem } from "./modules/knowledge-extraction/libs/types/knowledge-item.type.js";
export { extract } from "./modules/knowledge-extraction/services/knowledge-extraction.service.js";
export { type NodeMergeResult } from "./modules/node-merge/libs/types/types.js";
export { mergeNodeBlocks } from "./modules/node-merge/services/node-merge.service.js";
export { translateFileName } from "./modules/translation/libs/helpers/translate-file-name.helper.js";
export {
	translate,
	translateText,
} from "./modules/translation/services/translation.service.js";
export { DocumentParseFailedError } from "./parsers/libs/exceptions/document-parse-failed.exception.js";
export { type ParsedPageBlock } from "./parsers/libs/types/parsed-page-block.type.js";
export { parseDocument } from "./parsers/parse-document.js";
