import { type DocumentProcessingProgressDto } from "@knowledgeprism/types";
import { setTimeout } from "node:timers/promises";

import { logger } from "~/logger/logger.js";
import { assembleSections } from "~/modules/document-structure/libs/helpers/assemble-sections.helper.js";

import { extractBlocks } from "../libs/helpers/extract-blocks.helper.js";
import { invokePageExtraction } from "../libs/helpers/invoke-page-extraction.helper.js";
import { type ExtractionBlock } from "../libs/types/extraction-block.type.js";
import { type ExtractionContext } from "../libs/types/extraction-context.type.js";
import { type ExtractionResponseRecord } from "../libs/types/extraction-response-record.type.js";
import { type ExtractionResult } from "../libs/types/extraction-result.type.js";

type ExtractOptions = {
	context?: ExtractionContext;
	onProgress?: (progress: DocumentProcessingProgressDto) => Promise<void>;
	onResponse?: (response: ExtractionResponseRecord) => Promise<void>;
};

const extract = async (
	blocks: ExtractionBlock[],
	{ context = {}, onProgress, onResponse }: ExtractOptions = {},
): Promise<ExtractionResult> => {
	const result = await extractBlocks(blocks, {
		context,
		invoke: invokePageExtraction,
		logger,
		...(onProgress && { onProgress }),
		...(onResponse && { onResponse }),
		pause: setTimeout,
	});

	return { ...result, items: assembleSections(result.items) };
};

export { extract };
