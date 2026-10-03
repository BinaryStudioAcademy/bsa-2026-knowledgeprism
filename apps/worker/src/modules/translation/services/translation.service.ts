import { mapWithConcurrency } from "@knowledgeprism/config";

import { ExtractionChunk } from "~/modules/knowledge-extraction/libs/constants/extraction-chunk.constant.js";
import { type ExtractionBlock } from "~/modules/knowledge-extraction/libs/types/extraction-block.type.js";

import { alignTranslatedText } from "../libs/helpers/align-translated-text.helper.js";
import { invokePageTranslation } from "../libs/helpers/invoke-page-translation.helper.js";
import { isEnglishText } from "../libs/helpers/is-english-text.helper.js";
import { withTransientRetries } from "../libs/helpers/with-transient-retries.helper.js";

const SOURCE_RANGE_START = 0;

const translateText = async (text: string): Promise<string> => {
	return await withTransientRetries(() => invokePageTranslation(text));
};

const translate = async <T extends ExtractionBlock>(
	blocks: T[],
): Promise<T[]> => {
	return await mapWithConcurrency(
		blocks,
		ExtractionChunk.MAXIMUM_CONCURRENT_REQUESTS,
		async (block) => {
			if (isEnglishText(block.content)) {
				return block;
			}

			const translatedContent = await translateText(block.content);

			return {
				...block,
				content: translatedContent,
				originalContent: block.content,
				sourceMappings: alignTranslatedText(block.content, translatedContent),
				sourceRange: {
					end: block.content.length,
					start: SOURCE_RANGE_START,
				},
			};
		},
	);
};

export { translate, translateText };
