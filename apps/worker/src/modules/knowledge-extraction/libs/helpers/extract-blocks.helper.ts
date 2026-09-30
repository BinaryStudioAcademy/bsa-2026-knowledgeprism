import { type ExtractionBlock } from "../types/extraction-block.type.js";
import { type ExtractionDependencies } from "../types/extraction-dependencies.type.js";
import { type ExtractionResult } from "../types/extraction-result.type.js";
import { type KnowledgeItem } from "../types/knowledge-item.type.js";
import { extractChunk } from "./extract-chunk.helper.js";
import { isBlankPageContent } from "./is-blank-page-content.helper.js";
import { splitIntoChunks } from "./split-into-chunks.helper.js";

const EMPTY_COUNT = 0;

const extractBlocks = async (
	blocks: ExtractionBlock[],
	dependencies: ExtractionDependencies,
): Promise<ExtractionResult> => {
	const items: KnowledgeItem[] = [];
	const failedPageNumbers = new Set<number>();
	let successfulChunkCount = 0;
	const chunks = blocks.flatMap((block) =>
		splitIntoChunks(block.content).map((content) => ({ ...block, content })),
	);

	for (const [chunkIndex, chunk] of chunks.entries()) {
		if (isBlankPageContent(chunk.content)) {
			continue;
		}

		const result = await extractChunk({ ...chunk, chunkIndex }, dependencies);
		successfulChunkCount += result.successfulChunkCount;
		items.push(...result.items);

		if (result.hasFailures) {
			failedPageNumbers.add(chunk.pageNumber);
			dependencies.logger.error(
				"Extraction chunk recovery exhausted; page is incomplete.",
				{
					...dependencies.context,
					chunkIndex,
					pageNumber: chunk.pageNumber,
				},
			);
		}
	}

	if (
		successfulChunkCount === EMPTY_COUNT &&
		failedPageNumbers.size > EMPTY_COUNT
	) {
		throw new Error("Knowledge extraction failed for every chunk.");
	}

	return {
		failedPageNumbers: [...failedPageNumbers].toSorted(
			(left, right) => left - right,
		),
		items,
	};
};

export { extractBlocks };
