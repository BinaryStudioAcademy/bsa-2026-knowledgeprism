import { logger } from "~/logger/logger.js";

import { invokePageExtraction } from "../libs/helpers/invoke-page-extraction.helper.js";
import { isBlankPageContent } from "../libs/helpers/is-blank-page-content.helper.js";
import { mapExtractionOutput } from "../libs/helpers/map-extraction-output.helper.js";
import { type KnowledgeItem } from "../libs/types/types.js";

type ExtractionBlock = {
	content: string;
	pageNumber: number;
};

const EMPTY_ITEM_COUNT = 0;

const extract = async (blocks: ExtractionBlock[]): Promise<KnowledgeItem[]> => {
	const items: KnowledgeItem[] = [];

	for (const block of blocks) {
		if (isBlankPageContent(block.content)) {
			logger.info(`Skipped blank page ${block.pageNumber.toString()}`);
			continue;
		}

		const raw = await invokePageExtraction(block.content);
		const pageItems = mapExtractionOutput(raw, block.pageNumber);

		if (pageItems.length === EMPTY_ITEM_COUNT) {
			logger.warn(
				`No knowledge items extracted from page ${block.pageNumber.toString()}`,
			);
		}

		items.push(...pageItems);
	}

	return items;
};

export { extract };
