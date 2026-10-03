import { mapWithConcurrency } from "@knowledgeprism/config";
import { DocumentProcessingPhase } from "@knowledgeprism/constants";
import { type DocumentProcessingProgressDto } from "@knowledgeprism/types";

import { ExtractionChunk } from "../constants/extraction-chunk.constant.js";
import { type ExtractionBlock } from "../types/extraction-block.type.js";
import { type ExtractionDependencies } from "../types/extraction-dependencies.type.js";
import { type ExtractionResult } from "../types/extraction-result.type.js";
import { type KnowledgeItem } from "../types/knowledge-item.type.js";
import { extractChunk } from "./extract-chunk.helper.js";
import { findExcerptPage } from "./find-excerpt-page.helper.js";
import { isBlankPageContent } from "./is-blank-page-content.helper.js";
import { withInheritedHeading } from "./map-extraction-output.helper.js";
import {
	hasLeadingHeading,
	readPreviousHeading,
} from "./read-previous-heading.helper.js";
import { splitIntoChunks } from "./split-into-chunks.helper.js";

const EMPTY_COUNT = 0;
const LAST_ITEM_INDEX = -1;
const LINE_BREAK = /\r?\n/u;
const TITLE_MAXIMUM_LENGTH = 80;
const TITLE_START = 0;
const FIRST_PART = 0;
const PREVIOUS_CHUNK_OFFSET = 1;

type ChunkOutcome = {
	chunk: IndexedChunk;
	result: Awaited<ReturnType<typeof extractChunk>>;
};

type IndexedChunk = ExtractionBlock & { chunkIndex: number };

const toNonBlankChunks = (
	blocks: ExtractionBlock[],
	maximumLength?: number,
): IndexedChunk[] =>
	blocks
		.flatMap((block) =>
			splitIntoChunks(block.content, maximumLength).map((content) => ({
				...block,
				content,
			})),
		)
		.map((chunk, chunkIndex) => ({ ...chunk, chunkIndex }))
		.filter((chunk) => !isBlankPageContent(chunk.content));

const isSectionChunk = (chunk: IndexedChunk): boolean => {
	return chunk.sectionTitle !== undefined && chunk.sectionTitle !== null;
};

const toPreviousHeading = (
	chunk: IndexedChunk,
	previous: IndexedChunk | undefined,
): null | string => {
	if (isSectionChunk(chunk)) {
		return (chunk.part ?? FIRST_PART) > FIRST_PART
			? (chunk.sectionTitle ?? null)
			: null;
	}

	return previous && !hasLeadingHeading(chunk.content)
		? readPreviousHeading(previous.content)
		: null;
};

const readFirstSourceLine = (content: string): string => {
	const firstLine =
		content
			.split(LINE_BREAK)
			.map((line) => line.trim())
			.find((line) => line !== "") ?? "";

	return firstLine.slice(TITLE_START, TITLE_MAXIMUM_LENGTH);
};

const inheritOpenHeadings = (outcomes: ChunkOutcome[]): ChunkOutcome[] => {
	let openHeading: null | string = null;

	return outcomes.map(({ chunk, result }) => {
		const items = result.items.map((item) =>
			item.isHeadingInherited
				? withInheritedHeading(
						item,
						chunk.sectionTitle ??
							openHeading ??
							readFirstSourceLine(chunk.content),
					)
				: item,
		);
		openHeading = result.hasFailures
			? null
			: (items.at(LAST_ITEM_INDEX)?.heading ?? null);

		return { chunk, result: { ...result, items } };
	});
};

const extractBlocks = async (
	blocks: ExtractionBlock[],
	dependencies: ExtractionDependencies,
): Promise<ExtractionResult> => {
	const items: KnowledgeItem[] = [];
	const failedPageNumbers = new Set<number>();
	let successfulChunkCount = 0;
	const chunks = toNonBlankChunks(blocks, dependencies.maximumChunkLength);
	const progress: DocumentProcessingProgressDto = {
		failedUnits: 0,
		phase: DocumentProcessingPhase.EXTRACTING,
		processedUnits: 0,
		totalUnits: chunks.length,
	};
	await dependencies.onProgress?.({ ...progress });
	const headedChunks = chunks.map((chunk, index) => ({
		chunk,
		previousHeading: toPreviousHeading(
			chunk,
			chunks[index - PREVIOUS_CHUNK_OFFSET],
		),
	}));
	const outcomes = await mapWithConcurrency(
		headedChunks,
		ExtractionChunk.MAXIMUM_CONCURRENT_REQUESTS,
		async ({ chunk, previousHeading }): Promise<ChunkOutcome> => {
			let result: Awaited<ReturnType<typeof extractChunk>>;
			try {
				result = await extractChunk(
					{ ...chunk, previousHeading },
					dependencies,
				);
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

	const carriedOutcomes = inheritOpenHeadings(outcomes);

	for (const { chunk, result } of carriedOutcomes) {
		successfulChunkCount += result.successfulChunkCount;
		items.push(
			...result.items.map((item) => ({
				...item,
				chunkIndex: chunk.chunkIndex,
				sectionIndex: chunk.sectionIndex ?? null,
				sectionTitle: chunk.sectionTitle ?? null,
				sourcePageNumber: findExcerptPage(chunk, item.sourceExcerpt),
			})),
		);

		if (result.hasFailures) {
			for (
				let pageNumber = chunk.pageNumber;
				pageNumber <= (chunk.pageEnd ?? chunk.pageNumber);
				pageNumber++
			) {
				failedPageNumbers.add(pageNumber);
			}
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
