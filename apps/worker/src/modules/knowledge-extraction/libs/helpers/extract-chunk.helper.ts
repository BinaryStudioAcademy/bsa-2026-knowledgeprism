import {
	BedrockResponseError,
	BedrockResponseFailure,
} from "~/bedrock/bedrock-response-error.exception.js";

import { ExtractionRecovery } from "../constants/extraction-recovery.constant.js";
import { ExtractionOutputError } from "../exceptions/extraction-output-error.exception.js";
import { type ExtractionBlock } from "../types/extraction-block.type.js";
import { type ExtractionDependencies } from "../types/extraction-dependencies.type.js";
import { type KnowledgeItem } from "../types/knowledge-item.type.js";
import { isTransientExtractionError } from "./is-transient-extraction-error.helper.js";
import { mapExtractionOutput } from "./map-extraction-output.helper.js";

type Chunk = ExtractionBlock & {
	chunkIndex: number;
	splitPart?: number;
};

type ChunkResult = {
	hasFailures: boolean;
	items: KnowledgeItem[];
	successfulChunkCount: number;
};

const NO_SUCCESSFUL_CHUNKS = 0;
const ONE_SUCCESSFUL_CHUNK = 1;
const FIRST_ATTEMPT = 1;
const FIRST_CHARACTER_INDEX = 0;

const isRetryable = (error: unknown): boolean =>
	error instanceof ExtractionOutputError ||
	(error instanceof BedrockResponseError &&
		error.reason === BedrockResponseFailure.INVALID_RESPONSE) ||
	isTransientExtractionError(error);

const extractSplitChunk = async (
	chunk: Chunk,
	dependencies: ExtractionDependencies,
): Promise<ChunkResult> => {
	const midpoint = Math.ceil(
		chunk.content.length / ExtractionRecovery.SPLIT_PARTS,
	);
	const parts = [
		chunk.content.slice(FIRST_CHARACTER_INDEX, midpoint),
		chunk.content.slice(midpoint),
	];
	const result: ChunkResult = {
		hasFailures: false,
		items: [],
		successfulChunkCount: NO_SUCCESSFUL_CHUNKS,
	};

	for (const [splitPart, content] of parts.entries()) {
		if (content.trim() === "") {
			continue;
		}

		const partial = await extractChunk(
			{ ...chunk, content, splitPart },
			dependencies,
		);
		result.hasFailures ||= partial.hasFailures;
		result.items.push(...partial.items);
		result.successfulChunkCount += partial.successfulChunkCount;
	}

	return result;
};

const handleFailure = (
	error: unknown,
	chunk: Chunk & { attempt: number },
	dependencies: ExtractionDependencies,
): void => {
	const isOutputFailure =
		error instanceof ExtractionOutputError ||
		error instanceof BedrockResponseError;
	dependencies.logger.warn("Extraction chunk attempt failed.", {
		...dependencies.context,
		attempt: chunk.attempt,
		chunkIndex: chunk.chunkIndex,
		pageNumber: chunk.pageNumber,
		reason: isOutputFailure ? error.reason : "invocation_error",
		splitPart: chunk.splitPart,
	});

	if (!isOutputFailure && !isTransientExtractionError(error)) {
		throw error;
	}
};

const extractChunk = async (
	chunk: Chunk,
	dependencies: ExtractionDependencies,
): Promise<ChunkResult> => {
	for (
		let attempt = FIRST_ATTEMPT;
		attempt <= ExtractionRecovery.MAXIMUM_ATTEMPTS;
		attempt++
	) {
		try {
			const raw = await dependencies.invoke(chunk.content);
			const items = mapExtractionOutput(raw, chunk);

			return {
				hasFailures: false,
				items,
				successfulChunkCount: ONE_SUCCESSFUL_CHUNK,
			};
		} catch (error) {
			handleFailure(error, { ...chunk, attempt }, dependencies);

			if (
				error instanceof BedrockResponseError &&
				error.reason === BedrockResponseFailure.TRUNCATED &&
				chunk.splitPart === undefined &&
				chunk.content.length >= ExtractionRecovery.MINIMUM_SPLIT_LENGTH
			) {
				// One split level only: at most three parent calls plus three per half.
				return await extractSplitChunk(chunk, dependencies);
			}

			if (
				!isRetryable(error) ||
				attempt === ExtractionRecovery.MAXIMUM_ATTEMPTS
			) {
				break;
			}

			await dependencies.pause(ExtractionRecovery.RETRY_DELAY_MS * attempt);
		}
	}

	return {
		hasFailures: true,
		items: [],
		successfulChunkCount: NO_SUCCESSFUL_CHUNKS,
	};
};

export { extractChunk };
