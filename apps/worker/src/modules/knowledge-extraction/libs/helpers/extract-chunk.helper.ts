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
import { splitTruncatedChunk } from "./split-truncated-chunk.helper.js";

type Chunk = ExtractionBlock & {
	chunkIndex: number;
	previousHeading?: null | string;
	splitPart?: number;
};

type ChunkResult = {
	hasFailures: boolean;
	items: KnowledgeItem[];
	successfulChunkCount: number;
};

const ERROR_DETAIL_SEPARATOR = ":";
const INVOCATION_ERROR_REASON = "invocation_error";
const NO_SUCCESSFUL_CHUNKS = 0;
const ONE_SUCCESSFUL_CHUNK = 1;
const FIRST_ATTEMPT = 1;

const isRetryable = (error: unknown): boolean =>
	error instanceof ExtractionOutputError ||
	(error instanceof BedrockResponseError &&
		error.reason === BedrockResponseFailure.INVALID_RESPONSE) ||
	isTransientExtractionError(error);

const extractSplitChunk = async (
	chunk: Chunk,
	dependencies: ExtractionDependencies,
): Promise<ChunkResult> => {
	const parts = splitTruncatedChunk(chunk.content);
	const result: ChunkResult = {
		hasFailures: false,
		items: [],
		successfulChunkCount: NO_SUCCESSFUL_CHUNKS,
	};

	if (parts === null) {
		return { ...result, hasFailures: true };
	}

	for (const [splitPart, content] of parts.entries()) {
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

const toErrorReason = (error: unknown): string => {
	if (error instanceof ExtractionOutputError && error.detail) {
		return `${error.reason}${ERROR_DETAIL_SEPARATOR}${error.detail}`;
	}

	return error instanceof ExtractionOutputError ||
		error instanceof BedrockResponseError
		? error.reason
		: INVOCATION_ERROR_REASON;
};

const toRawResponse = (raw: unknown): null | string => {
	if (raw === undefined || raw === null) {
		return null;
	}

	return typeof raw === "string" ? raw : JSON.stringify(raw);
};

const recordResponse = async (
	chunk: Chunk & { attempt: number },
	dependencies: ExtractionDependencies,
	{ error, raw }: { error: unknown; raw: unknown },
): Promise<void> => {
	await dependencies.onResponse?.({
		attempt: chunk.attempt,
		chunkIndex: chunk.chunkIndex,
		errorReason: error === null ? null : toErrorReason(error),
		rawResponse: toRawResponse(raw),
		splitPart: chunk.splitPart ?? null,
	});
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
		rejection: error instanceof ExtractionOutputError ? error.detail : null,
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
		let raw: unknown = null;

		try {
			raw = await dependencies.invoke(
				chunk.content,
				chunk.previousHeading ?? null,
			);
			const items = mapExtractionOutput(raw, chunk.pageNumber, chunk.content);
			await recordResponse({ ...chunk, attempt }, dependencies, {
				error: null,
				raw,
			});

			return {
				hasFailures: false,
				items,
				successfulChunkCount: ONE_SUCCESSFUL_CHUNK,
			};
		} catch (error) {
			await recordResponse({ ...chunk, attempt }, dependencies, {
				error,
				raw,
			});
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
