import {
	AccessDeniedException,
	ServiceUnavailableException,
} from "@aws-sdk/client-bedrock-runtime";
import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
	BedrockResponseError,
	BedrockResponseFailure,
} from "~/bedrock/bedrock-response-error.exception.js";

import { ExtractionChunk } from "../constants/extraction-chunk.constant.js";
import { ExtractionRecovery } from "../constants/extraction-recovery.constant.js";
import { type ExtractionDependencies } from "../types/extraction-dependencies.type.js";
import { extractBlocks } from "./extract-blocks.helper.js";

const PAGE_NUMBER = 16;
const NEXT_PAGE_NUMBER = 17;
const DOCUMENT_ID = 42;
const PROCESSING_ATTEMPT = 2;
const SINGLE_CALL = 1;
const TWO_CALLS = 2;
const THREE_CALLS = 3;
const MAXIMUM_RECOVERY_CALLS = 9;
const EMPTY_COUNT = 0;
const HALF_LENGTH = 400;
const SOURCE = "Editors may upload documents.";
const BLOCK = { content: SOURCE, pageNumber: PAGE_NUMBER };
const LONG_SOURCE = `${"a".repeat(HALF_LENGTH)}${"b".repeat(HALF_LENGTH)}`;
const EMPTY_OUTPUT = { items: [] };

const outputFor = (content: string): unknown => ({
	items: [
		{
			confidence: 0.9,
			rationale: "Explicit source statement.",
			sourceExcerpt: content,
			text: content,
			title: "Source statement",
		},
	],
});

const truncated = (): BedrockResponseError =>
	new BedrockResponseError(BedrockResponseFailure.TRUNCATED);

const createSetup = (invoke: ExtractionDependencies["invoke"]) => {
	const calls: string[] = [];
	const delays: number[] = [];
	const logs: Record<string, unknown>[] = [];
	const recordLog = (
		_message: string,
		parameters: Record<string, unknown> = {},
	): void => {
		logs.push(parameters);
	};
	const dependencies: ExtractionDependencies = {
		context: { documentId: DOCUMENT_ID, processingAttempt: PROCESSING_ATTEMPT },
		invoke: (content) => {
			calls.push(content);
			return invoke(content);
		},
		logger: {
			debug: recordLog,
			error: recordLog,
			info: recordLog,
			warn: recordLog,
		},
		pause: (milliseconds) => {
			delays.push(milliseconds);
			return Promise.resolve();
		},
	};

	return { calls, delays, dependencies, logs };
};

void describe("extraction recovery", () => {
	void it("retries malformed output and returns successful items exactly once", async () => {
		let attempt = 0;
		const setup = createSetup((content) =>
			Promise.resolve(
				++attempt === SINGLE_CALL ? "{broken" : outputFor(content),
			),
		);
		const result = await extractBlocks([BLOCK], setup.dependencies);
		assert.equal(setup.calls.length, TWO_CALLS);
		assert.equal(result.items.length, SINGLE_CALL);
		assert.deepEqual(result.failedPageNumbers, []);
		assert.deepEqual(setup.delays, [ExtractionRecovery.RETRY_DELAY_MS]);
		assert.ok(
			setup.logs.every(
				(log) =>
					log["documentId"] === DOCUMENT_ID &&
					log["pageNumber"] === PAGE_NUMBER,
			),
		);
	});

	void it("does not retain valid items from an otherwise invalid attempt", async () => {
		let attempt = 0;
		const setup = createSetup((content) =>
			Promise.resolve(
				++attempt === SINGLE_CALL
					? {
							items: [
								{
									confidence: 1,
									rationale: "Source fact",
									sourceExcerpt: SOURCE,
									text: SOURCE,
									title: "Fact",
								},
								null,
							],
						}
					: outputFor(content),
			),
		);
		const result = await extractBlocks([BLOCK], setup.dependencies);
		assert.equal(result.items.length, SINGLE_CALL);
		assert.equal(setup.calls.length, TWO_CALLS);
	});

	void it("treats an empty result as successful and skips blank pages", async () => {
		const setup = createSetup(() => Promise.resolve(EMPTY_OUTPUT));
		assert.deepEqual(
			await extractBlocks(
				[{ ...BLOCK, content: " \n " }, BLOCK],
				setup.dependencies,
			),
			{ failedPageNumbers: [], items: [] },
		);
		assert.equal(setup.calls.length, SINGLE_CALL);
	});

	void it("bounds retries and fails when every nonblank chunk fails", async () => {
		const setup = createSetup(() => Promise.resolve("{broken"));
		await assert.rejects(
			extractBlocks([BLOCK], setup.dependencies),
			/failed for every chunk/u,
		);
		assert.equal(setup.calls.length, ExtractionRecovery.MAXIMUM_ATTEMPTS);
	});

	void it("keeps successful pages and records unique sorted failed pages", async () => {
		const setup = createSetup((content) =>
			Promise.resolve(content === SOURCE ? outputFor(content) : "{broken"),
		);
		const result = await extractBlocks(
			[
				{ content: "broken", pageNumber: NEXT_PAGE_NUMBER },
				{ content: "broken", pageNumber: PAGE_NUMBER },
				{ content: "broken again", pageNumber: PAGE_NUMBER },
				BLOCK,
			],
			setup.dependencies,
		);
		assert.deepEqual(result.failedPageNumbers, [PAGE_NUMBER, NEXT_PAGE_NUMBER]);
		assert.equal(result.items.length, SINGLE_CALL);
	});

	void it("flags a page when one of its original chunks fails", async () => {
		const setup = createSetup((content) =>
			Promise.resolve(content === SOURCE ? outputFor(content) : "{broken"),
		);
		const result = await extractBlocks(
			[
				{
					...BLOCK,
					content: `${"x".repeat(ExtractionChunk.MAXIMUM_LENGTH)}\n\n${SOURCE}`,
				},
			],
			setup.dependencies,
		);
		assert.equal(result.items.length, SINGLE_CALL);
		assert.deepEqual(result.failedPageNumbers, [PAGE_NUMBER]);
	});

	void it("reprocesses truncated content as two nonoverlapping halves", async () => {
		const setup = createSetup((content) =>
			content === LONG_SOURCE
				? Promise.reject(truncated())
				: Promise.resolve(outputFor(content)),
		);
		const result = await extractBlocks(
			[{ ...BLOCK, content: LONG_SOURCE }],
			setup.dependencies,
		);
		assert.equal(setup.calls.length, THREE_CALLS);
		assert.equal(result.items.length, TWO_CALLS);
		assert.equal(
			result.items.map((item) => item.sourceExcerpt).join(""),
			LONG_SOURCE,
		);
		assert.ok(
			result.items.every((item) => item.sourcePageNumber === PAGE_NUMBER),
		);
		assert.deepEqual(result.failedPageNumbers, []);
	});

	void it("retains successful split halves while flagging an incomplete page", async () => {
		const setup = createSetup((content) => {
			if (content === LONG_SOURCE) {
				return Promise.reject(truncated());
			}

			return Promise.resolve(
				content.startsWith("a") ? outputFor(content) : "{broken",
			);
		});
		const result = await extractBlocks(
			[{ ...BLOCK, content: LONG_SOURCE }],
			setup.dependencies,
		);
		assert.equal(result.items.length, SINGLE_CALL);
		assert.deepEqual(result.failedPageNumbers, [PAGE_NUMBER]);
	});

	void it("never recursively splits already split chunks", async () => {
		const setup = createSetup(() => Promise.reject(truncated()));
		await assert.rejects(
			extractBlocks([{ ...BLOCK, content: LONG_SOURCE }], setup.dependencies),
		);
		assert.equal(setup.calls.length, THREE_CALLS);
	});

	void it("limits the worst case to nine application invocations per original chunk", async () => {
		let attempt = 0;
		const setup = createSetup(() =>
			++attempt === ExtractionRecovery.MAXIMUM_ATTEMPTS
				? Promise.reject(truncated())
				: Promise.resolve("{broken"),
		);
		await assert.rejects(
			extractBlocks([{ ...BLOCK, content: LONG_SOURCE }], setup.dependencies),
		);
		assert.equal(setup.calls.length, MAXIMUM_RECOVERY_CALLS);
	});

	void it("backs off on a transient provider failure", async () => {
		let attempt = 0;
		const setup = createSetup((content) =>
			++attempt === SINGLE_CALL
				? Promise.reject(
						new ServiceUnavailableException({
							$metadata: {},
							message: "Unavailable",
						}),
					)
				: Promise.resolve(outputFor(content)),
		);
		const result = await extractBlocks([BLOCK], setup.dependencies);
		assert.equal(result.items.length, SINGLE_CALL);
		assert.equal(setup.delays.length, SINGLE_CALL);
	});

	void it("fails immediately on permanent provider errors without processing more pages", async () => {
		const denied = new AccessDeniedException({
			$metadata: {},
			message: "Access denied",
		});
		const setup = createSetup(() => Promise.reject(denied));
		await assert.rejects(
			extractBlocks([BLOCK, BLOCK], setup.dependencies),
			denied,
		);
		assert.equal(setup.calls.length, SINGLE_CALL);
		assert.equal(setup.delays.length, EMPTY_COUNT);
	});

	void it("records a refused page without retrying or disguising it as an empty result", async () => {
		const setup = createSetup((content) =>
			content === SOURCE
				? Promise.reject(
						new BedrockResponseError(BedrockResponseFailure.REFUSAL),
					)
				: Promise.resolve(EMPTY_OUTPUT),
		);
		const result = await extractBlocks(
			[BLOCK, { content: "Unrelated page", pageNumber: NEXT_PAGE_NUMBER }],
			setup.dependencies,
		);
		assert.deepEqual(result, { failedPageNumbers: [PAGE_NUMBER], items: [] });
		assert.equal(setup.calls.length, TWO_CALLS);
	});
});
