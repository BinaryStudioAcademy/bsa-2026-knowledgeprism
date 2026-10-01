import { type ExtractionBlock } from "~/modules/knowledge-extraction/libs/types/extraction-block.type.js";

import { invokePageTranslation } from "../libs/helpers/invoke-page-translation.helper.js";

const translateText = async (text: string): Promise<string> => {
	return await invokePageTranslation(text);
};

const translate = async (
	pages: ExtractionBlock[],
): Promise<ExtractionBlock[]> => {
	return await Promise.all(
		pages.map(async (page) => ({
			content: await translateText(page.content),
			pageNumber: page.pageNumber,
		})),
	);
};

export { translate, translateText };
