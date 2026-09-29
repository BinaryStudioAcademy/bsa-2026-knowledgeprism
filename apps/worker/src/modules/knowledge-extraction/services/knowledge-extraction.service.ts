import { logger } from "~/logger/logger.js";

import { invokePageExtraction } from "../libs/helpers/invoke-page-extraction.helper.js";
import { isBlankPageContent } from "../libs/helpers/is-blank-page-content.helper.js";
import { mapExtractionOutput } from "../libs/helpers/map-extraction-output.helper.js";
import { splitIntoChunks } from "../libs/helpers/split-into-chunks.helper.js";
import { type ExtractionBlock } from "../libs/types/extraction-block.type.js";
import { type KnowledgeItem } from "../libs/types/knowledge-item.type.js";

const EMPTY_ITEM_COUNT = 0;

const toChunks = (blocks: ExtractionBlock[]): ExtractionBlock[] => {
	return blocks.flatMap((block) => {
		return splitIntoChunks(block.content).map((content) => {
			return { content, pageNumber: block.pageNumber };
		});
	});
};

const extract = async (blocks: ExtractionBlock[]): Promise<KnowledgeItem[]> => {
	const items: KnowledgeItem[] = [];
	let attemptedChunkCount = 0;
	let failedChunkCount = 0;

	for (const chunk of toChunks(blocks)) {
		if (isBlankPageContent(chunk.content)) {
			logger.info(`Skipped blank page ${chunk.pageNumber.toString()}`);
			continue;
		}

		attemptedChunkCount++;

		try {
			const raw = await invokePageExtraction(chunk.content);
			const chunkItems = mapExtractionOutput(raw, chunk.pageNumber);

			if (chunkItems.length === EMPTY_ITEM_COUNT) {
				logger.warn(
					`No knowledge items extracted from a chunk of page ${chunk.pageNumber.toString()}`,
				);
			}

			items.push(...chunkItems);
		} catch (error) {
			failedChunkCount++;
			logger.error(
				`Failed to extract knowledge from a chunk of page ${chunk.pageNumber.toString()}`,
				{ error },
			);
		}
	}

	if (
		failedChunkCount === attemptedChunkCount &&
		attemptedChunkCount > EMPTY_ITEM_COUNT
	) {
		throw new Error("Knowledge extraction failed for every page.");
	}

	return items;
};

export { extract };
