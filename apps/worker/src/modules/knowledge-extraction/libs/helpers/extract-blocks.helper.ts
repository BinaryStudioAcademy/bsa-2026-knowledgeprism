import { mapWithConcurrency } from "@knowledgeprism/config";
import { DocumentProcessingPhase } from "@knowledgeprism/constants";
import { type DocumentProcessingProgressDto } from "@knowledgeprism/types";

import { ExtractionChunk } from "../constants/extraction-chunk.constant.js";
import { type ExtractionBlock } from "../types/extraction-block.type.js";
import { type ExtractionDependencies } from "../types/extraction-dependencies.type.js";
import { type ExtractionResult } from "../types/extraction-result.type.js";
import { type KnowledgeItem } from "../types/knowledge-item.type.js";
import { extractChunk } from "./extract-chunk.helper.js";
import { isBlankPageContent } from "./is-blank-page-content.helper.js";
import { splitIntoChunks } from "./split-into-chunks.helper.js";

const EMPTY_COUNT = 0;

type IndexedChunk = ExtractionBlock & { chunkIndex: number };

const toNonBlankChunks = (blocks: ExtractionBlock[]): IndexedChunk[] =>
	blocks
		.flatMap((block) =>
			splitIntoChunks(block.content).map((content) => ({ ...block, content })),
		)
		.map((chunk, chunkIndex) => ({ ...chunk, chunkIndex }))
		.filter((chunk) => !isBlankPageContent(chunk.content));

const extractBlocks = async (
	blocks: ExtractionBlock[],
	dependencies: ExtractionDependencies,
): Promise<ExtractionResult> => {
	const items: KnowledgeItem[] = [];
	const failedPageNumbers = new Set<number>();
	let successfulChunkCount = 0;
	const chunks = toNonBlankChunks(blocks);
	const progress: DocumentProcessingProgressDto = {
		failedUnits: 0,
		phase: DocumentProcessingPhase.EXTRACTING,
		processedUnits: 0,
		totalUnits: chunks.length,
	};
	await dependencies.onProgress?.({ ...progress });
	const outcomes = await mapWithConcurrency(
		chunks,
		ExtractionChunk.MAXIMUM_CONCURRENT_REQUESTS,
		async (chunk) => {
			let result: Awaited<ReturnType<typeof extractChunk>>;
			try {
				result = await extractChunk(chunk, dependencies);
			} catch (error) {
				progress.processedUnits++;
				progress.failedUnits++;
				await dependencies.onProgress?.({ ...progress });
				throw error;
			}
			progress.processedUnits++;
			if (result.hasFailures) {
				progress.failedUnits++;
			}
			await dependencies.onProgress?.({ ...progress });

			return { chunk, result };
		},
	);

	for (const { chunk, result } of outcomes) {
		successfulChunkCount += result.successfulChunkCount;
		items.push(...result.items);

		if (result.hasFailures) {
			failedPageNumbers.add(chunk.pageNumber);
			dependencies.logger.error(
				"Extraction chunk recovery exhausted; page is incomplete.",
				{
					...dependencies.context,
					chunkIndex: chunk.chunkIndex,
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
