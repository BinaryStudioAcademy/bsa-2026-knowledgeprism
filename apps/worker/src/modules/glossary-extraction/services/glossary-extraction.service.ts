import { GlossaryExtractionLimit } from "../libs/constants/glossary-extraction.constant.js";
import { invokeGlossaryExtraction } from "../libs/helpers/invoke-glossary-extraction.helper.js";
import { mapGlossaryExtractionOutput } from "../libs/helpers/map-glossary-extraction-output.helper.js";
import { type GlossaryTermCandidate } from "../libs/types/types.js";

const FIRST_INDEX = 0;

const extractGlossaryTerms = async ({
	content,
	existingNames,
}: {
	content: string;
	existingNames: readonly string[];
}): Promise<GlossaryTermCandidate[]> => {
	const trimmedContent = content
		.trim()
		.slice(FIRST_INDEX, GlossaryExtractionLimit.CONTENT_CHARACTERS);

	if (trimmedContent === "") {
		return [];
	}

	const raw = await invokeGlossaryExtraction(trimmedContent, existingNames);

	return mapGlossaryExtractionOutput({
		content: trimmedContent,
		existingNames,
		raw,
	});
};

export { extractGlossaryTerms };
