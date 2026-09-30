import { setTimeout } from "node:timers/promises";

import { logger } from "~/logger/logger.js";

import { extractBlocks } from "../libs/helpers/extract-blocks.helper.js";
import { invokePageExtraction } from "../libs/helpers/invoke-page-extraction.helper.js";
import { type ExtractionBlock } from "../libs/types/extraction-block.type.js";
import { type ExtractionContext } from "../libs/types/extraction-context.type.js";
import { type ExtractionResult } from "../libs/types/extraction-result.type.js";

const extract = async (
	blocks: ExtractionBlock[],
	context: ExtractionContext = {},
): Promise<ExtractionResult> => {
	return await extractBlocks(blocks, {
		context,
		invoke: invokePageExtraction,
		logger,
		pause: setTimeout,
	});
};

export { extract };
