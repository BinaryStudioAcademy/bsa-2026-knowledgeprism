import { splitIntoChunks } from "~/modules/knowledge-extraction/libs/helpers/split-into-chunks.helper.js";

import { GlossaryExtractionLimit } from "../constants/glossary-extraction.constant.js";
import { type GlossaryTermCandidate } from "../types/types.js";
import { mapGlossaryExtractionOutput } from "./map-glossary-extraction-output.helper.js";

type InvokeExtraction = (
	content: string,
	existingNames: readonly string[],
) => Promise<unknown>;

const extractTermsByChunk = async ({
	content,
	existingNames,
	invoke,
}: {
	content: string;
	existingNames: readonly string[];
	invoke: InvokeExtraction;
}): Promise<GlossaryTermCandidate[]> => {
	const candidates: GlossaryTermCandidate[] = [];
	const chunks = splitIntoChunks(
		content.trim(),
		GlossaryExtractionLimit.CONTENT_CHARACTERS,
	).filter((chunk) => chunk.trim() !== "");

	for (const chunk of chunks) {
		const knownNames = [
			...existingNames,
			...candidates.map(({ name }) => name),
		];
		const raw = await invoke(chunk, knownNames);

		candidates.push(
			...mapGlossaryExtractionOutput({
				content: chunk,
				existingNames: knownNames,
				raw,
			}),
		);
	}

	return candidates;
};

export { extractTermsByChunk };
