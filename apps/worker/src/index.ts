export { bedrockRuntimeClient } from "./bedrock/bedrock.js";
export { logger } from "./logger/logger.js";
export { downloadDocument } from "./modules/knowledge-extraction/libs/helpers/download-document.helper.js";
export { type ExtractionBlock } from "./modules/knowledge-extraction/libs/types/extraction-block.type.js";
export { type KnowledgeItem } from "./modules/knowledge-extraction/libs/types/knowledge-item.type.js";
export { extract } from "./modules/knowledge-extraction/services/knowledge-extraction.service.js";
export { type ParsedPageBlock } from "./parsers/libs/types/parsed-page-block.type.js";
export { parseDocument } from "./parsers/parse-document.js";
