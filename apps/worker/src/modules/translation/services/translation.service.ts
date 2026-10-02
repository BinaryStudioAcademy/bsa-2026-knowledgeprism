import { mapWithConcurrency } from "@knowledgeprism/config";

import { ExtractionChunk } from "~/modules/knowledge-extraction/libs/constants/extraction-chunk.constant.js";
import { type ExtractionBlock } from "~/modules/knowledge-extraction/libs/types/extraction-block.type.js";

import { invokePageTranslation } from "../libs/helpers/invoke-page-translation.helper.js";
import { isEnglishText } from "../libs/helpers/is-english-text.helper.js";

const translateText = async (text: string): Promise<string> => {
	return await invokePageTranslation(text);
};

const translate = async <T extends ExtractionBlock>(
	blocks: T[],
): Promise<T[]> => {
	return await mapWithConcurrency(
		blocks,
		ExtractionChunk.MAXIMUM_CONCURRENT_REQUESTS,
		async (block) =>
			isEnglishText(block.content)
				? block
				: { ...block, content: await translateText(block.content) },
	);
};

export { translate, translateText };
