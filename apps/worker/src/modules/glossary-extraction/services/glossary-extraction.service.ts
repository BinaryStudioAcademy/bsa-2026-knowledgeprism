import { extractTermsByChunk } from "../libs/helpers/extract-terms-by-chunk.helper.js";
import { invokeGlossaryExtraction } from "../libs/helpers/invoke-glossary-extraction.helper.js";
import { type GlossaryTermCandidate } from "../libs/types/types.js";

const extractGlossaryTerms = async ({
	content,
	existingNames,
}: {
	content: string;
	existingNames: readonly string[];
}): Promise<GlossaryTermCandidate[]> => {
	return await extractTermsByChunk({
		content,
		existingNames,
		invoke: invokeGlossaryExtraction,
	});
};

export { extractGlossaryTerms };
