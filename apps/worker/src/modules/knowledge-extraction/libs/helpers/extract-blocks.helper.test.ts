import {
	AccessDeniedException,
	ServiceUnavailableException,
} from "@aws-sdk/client-bedrock-runtime";
import { DocumentProcessingPhase } from "@knowledgeprism/constants";
import { type DocumentProcessingProgressDto } from "@knowledgeprism/types";
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
const PARAGRAPH_REPETITIONS = 12;
const SINGLE_SENTENCE_LENGTH = 600;
const THIRD_PAGE_NUMBER = 18;
const LEFT_PARAGRAPH = "Editors may upload project documents. ".repeat(
	PARAGRAPH_REPETITIONS,
);
const RIGHT_PARAGRAPH = "Viewers may read approved project knowledge. ".repeat(
	PARAGRAPH_REPETITIONS,
);
const BOUNDARY_RULE =
	"Access is denied unless the project owner explicitly approves the request.";
const SOURCE = "Editors may upload documents.";
const BLOCK = { content: SOURCE, pageNumber: PAGE_NUMBER };
const LONG_SOURCE = `${LEFT_PARAGRAPH}\n\n${RIGHT_PARAGRAPH}`;
const EMPTY_OUTPUT = { items: [] };

const HEADING_WORD_COUNT = 3;
const HEADING_WORD_START = 0;

const toSourceHeading = (content: string): string =>
	content
		.trim()
		.split(/\s+/u)
		.slice(HEADING_WORD_START, HEADING_WORD_COUNT)
		.join(" ");

const sectionFor = (heading: string, content: string): unknown => ({
	blocks: [
		{
			content: [{ text: heading, type: "text" }],
			props: { level: 2 },
			type: "heading",
		},
		{ content: [{ text: content, type: "text" }], type: "paragraph" },
	],
	confidence: 0.9,
	heading,
	order: 1,
	sourceExcerpt: content,
});

const outputFor = (content: string): unknown => ({
	items: [sectionFor(toSourceHeading(content), content)],
});

const truncated = (): BedrockResponseError =>
	new BedrockResponseError(BedrockResponseFailure.TRUNCATED);

const createSetup = (invoke: ExtractionDependencies["invoke"]) => {
	const calls: string[] = [];
	const progress: DocumentProcessingProgressDto[] = [];
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
		onProgress: (snapshot) => {
			progress.push(snapshot);
			return Promise.resolve();
		},
		pause: (milliseconds) => {
			delays.push(milliseconds);
			return Promise.resolve();
		},
	};

	return { calls, delays, dependencies, logs, progress };
};

void describe("extraction recovery", () => {
	void it("counts each original chunk once after retries and excludes blank input", async () => {
		let calls = 0;
		const setup = createSetup((content) =>
			++calls === SINGLE_CALL
				? Promise.reject(Object.assign(new Error("DNS"), { code: "EAI_AGAIN" }))
				: Promise.resolve(outputFor(content)),
		);
		await extractBlocks(
			[
				BLOCK,
				{ ...BLOCK, content: " ".repeat(THREE_CALLS) },
				{ ...BLOCK, content: "Another chunk" },
			],
			setup.dependencies,
		);
		assert.deepEqual(setup.progress, [
			{
				failedUnits: 0,
				phase: DocumentProcessingPhase.EXTRACTING,
				processedUnits: 0,
				totalUnits: TWO_CALLS,
			},
			{
				failedUnits: 0,
				phase: DocumentProcessingPhase.EXTRACTING,
				processedUnits: SINGLE_CALL,
				totalUnits: TWO_CALLS,
			},
			{
				failedUnits: 0,
				phase: DocumentProcessingPhase.EXTRACTING,
				processedUnits: TWO_CALLS,
				totalUnits: TWO_CALLS,
			},
		]);
	});

	void it("counts a partially recovered chunk as processed but incomplete", async () => {
		const setup = createSetup((content) => {
			if (content === LONG_SOURCE) {
				return Promise.reject(truncated());
			}
			return Promise.resolve(
				content.startsWith(LEFT_PARAGRAPH) ? outputFor(content) : "{broken",
			);
		});
		await extractBlocks(
			[{ ...BLOCK, content: LONG_SOURCE }],
			setup.dependencies,
		);
		assert.deepEqual(setup.progress.at(-SINGLE_CALL), {
			failedUnits: SINGLE_CALL,
			phase: DocumentProcessingPhase.EXTRACTING,
			processedUnits: SINGLE_CALL,
			totalUnits: SINGLE_CALL,
		});
		assert.equal(setup.progress.length, TWO_CALLS);
	});

	void it("reports exhausted failures before the entire extraction fails", async () => {
		const setup = createSetup(() => Promise.resolve("{broken"));
		await assert.rejects(
			extractBlocks([BLOCK], setup.dependencies),
			/failed for every chunk/u,
		);
		assert.deepEqual(setup.progress.at(-SINGLE_CALL), {
			failedUnits: SINGLE_CALL,
			phase: DocumentProcessingPhase.EXTRACTING,
			processedUnits: SINGLE_CALL,
			totalUnits: SINGLE_CALL,
		});
	});

	void it("reports a fatal invocation failure", async () => {
		const setup = createSetup(() =>
			Promise.reject(new Error("Permanent failure")),
		);
		await assert.rejects(
			extractBlocks([BLOCK, BLOCK], setup.dependencies),
			/Permanent failure/u,
		);
		assert.ok(
			setup.progress.some(
				({ failedUnits, phase, totalUnits }) =>
					failedUnits >= SINGLE_CALL &&
					phase === DocumentProcessingPhase.EXTRACTING &&
					totalUnits === TWO_CALLS,
			),
		);
	});

	void it("reports no work for an empty document without inventing a percentage", async () => {
		const setup = createSetup(() => Promise.resolve(EMPTY_OUTPUT));
		await extractBlocks([], setup.dependencies);
		assert.deepEqual(setup.progress, [
			{
				failedUnits: 0,
				phase: DocumentProcessingPhase.EXTRACTING,
				processedUnits: 0,
				totalUnits: 0,
			},
		]);
	});

	void it("recovers from a temporary DNS error without duplicating prior results", async () => {
		let networkAttempts = 0;
		const setup = createSetup((content) => {
			if (content === "Second page" && ++networkAttempts === SINGLE_CALL) {
				return Promise.reject(
					Object.assign(new Error("Temporary DNS failure"), {
						code: "EAI_AGAIN",
					}),
				);
			}

			return Promise.resolve(outputFor(content));
		});
		const result = await extractBlocks(
			[BLOCK, { content: "Second page", pageNumber: NEXT_PAGE_NUMBER }],
			setup.dependencies,
		);
		assert.deepEqual(
			result.items.map((item) => item.sourcePageNumber),
			[PAGE_NUMBER, NEXT_PAGE_NUMBER],
		);
		assert.deepEqual(result.failedPageNumbers, []);
		assert.equal(networkAttempts, TWO_CALLS);
		assert.deepEqual(setup.delays, [ExtractionRecovery.RETRY_DELAY_MS]);
	});

	void it("keeps earlier successes and processes later pages after network retries are exhausted", async () => {
		const setup = createSetup((content) =>
			content === "Failing page"
				? Promise.reject(
						Object.assign(new Error("Temporary DNS failure"), {
							code: "EAI_AGAIN",
						}),
					)
				: Promise.resolve(outputFor(content)),
		);
		const result = await extractBlocks(
			[
				BLOCK,
				{ content: "Failing page", pageNumber: NEXT_PAGE_NUMBER },
				{ content: "Last page", pageNumber: THIRD_PAGE_NUMBER },
			],
			setup.dependencies,
		);
		assert.deepEqual(
			result.items.map((item) => item.sourcePageNumber),
			[PAGE_NUMBER, THIRD_PAGE_NUMBER],
		);
		assert.deepEqual(result.failedPageNumbers, [NEXT_PAGE_NUMBER]);
		assert.equal(
			setup.calls.filter((content) => content === "Failing page").length,
			ExtractionRecovery.MAXIMUM_ATTEMPTS,
		);
		assert.deepEqual(setup.delays, [
			ExtractionRecovery.RETRY_DELAY_MS,
			ExtractionRecovery.RETRY_DELAY_MS * TWO_CALLS,
		]);
	});

	void it("fails after bounded retries when every page has a transport failure", async () => {
		const setup = createSetup(() =>
			Promise.reject(
				Object.assign(new Error("Temporary DNS failure"), {
					code: "EAI_AGAIN",
				}),
			),
		);
		await assert.rejects(
			extractBlocks([BLOCK], setup.dependencies),
			/failed for every chunk/u,
		);
		assert.equal(setup.calls.length, ExtractionRecovery.MAXIMUM_ATTEMPTS);
	});

	void it("keeps a complete conditional rule that crosses the character midpoint", async () => {
		const padding = "Background information. ".repeat(PARAGRAPH_REPETITIONS);
		const source = `${padding}${BOUNDARY_RULE} ${padding}`;
		const setup = createSetup((content) => {
			if (content === source) {
				return Promise.reject(truncated());
			}

			return Promise.resolve(
				content.includes(BOUNDARY_RULE)
					? outputFor(BOUNDARY_RULE)
					: EMPTY_OUTPUT,
			);
		});
		const result = await extractBlocks(
			[{ ...BLOCK, content: source }],
			setup.dependencies,
		);
		assert.deepEqual(
			result.items.map((item) => item.sourceExcerpt),
			[BOUNDARY_RULE],
		);
		assert.deepEqual(result.failedPageNumbers, []);
		assert.equal(setup.calls.length, THREE_CALLS);
	});

	void it("records an unsplittable truncated sentence instead of sending fragments", async () => {
		const sentence = `${"x".repeat(SINGLE_SENTENCE_LENGTH)} requires approval.`;
		const setup = createSetup((content) =>
			content === sentence
				? Promise.reject(truncated())
				: Promise.resolve(outputFor(content)),
		);
		const result = await extractBlocks(
			[BLOCK, { content: sentence, pageNumber: NEXT_PAGE_NUMBER }],
			setup.dependencies,
		);
		assert.deepEqual(
			result.items.map((item) => item.sourcePageNumber),
			[PAGE_NUMBER],
		);
		assert.deepEqual(result.failedPageNumbers, [NEXT_PAGE_NUMBER]);
		assert.equal(setup.calls.length, TWO_CALLS);
	});

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
							items: [sectionFor(toSourceHeading(SOURCE), SOURCE), null],
						}
					: outputFor(content),
			),
		);
		const result = await extractBlocks([BLOCK], setup.dependencies);
		assert.equal(result.items.length, SINGLE_CALL);
		assert.equal(setup.calls.length, TWO_CALLS);
	});

	void it("re-extracts a chunk with the heading the previous chunk left open", async () => {
		const openingPage = `${SOURCE}\n## Setup`;
		const setup = createSetup((content) => Promise.resolve(outputFor(content)));
		const result = await extractBlocks(
			[
				{ content: openingPage, pageNumber: PAGE_NUMBER },
				{ content: SOURCE, pageNumber: NEXT_PAGE_NUMBER },
			],
			setup.dependencies,
		);

		assert.equal(setup.calls.length, THREE_CALLS);
		assert.deepEqual(setup.calls, [openingPage, SOURCE, SOURCE]);
		assert.deepEqual(
			result.items.map((item) => item.sourcePageNumber),
			[PAGE_NUMBER, NEXT_PAGE_NUMBER],
		);
	});

	void it("gives a continued section the heading still open on the previous page", async () => {
		const continuation = "Viewers may read approved project knowledge.";
		const setup = createSetup((content) =>
			Promise.resolve(
				content === continuation
					? { items: [sectionFor("Reading rules", continuation)] }
					: outputFor(content),
			),
		);
		const result = await extractBlocks(
			[
				{ content: SOURCE, pageNumber: PAGE_NUMBER },
				{ content: continuation, pageNumber: NEXT_PAGE_NUMBER },
			],
			setup.dependencies,
		);
		const [, continued] = result.items;

		assert.ok(continued);
		assert.equal(continued.heading, toSourceHeading(SOURCE));
		assert.equal(continued.title, toSourceHeading(SOURCE));
		assert.equal(continued.isHeadingInherited, undefined);
	});

	void it("titles an opening continuation with its own first line", async () => {
		const continuation = "Viewers may read approved project knowledge.";
		const setup = createSetup(() =>
			Promise.resolve({
				items: [sectionFor("Reading rules", continuation)],
			}),
		);
		const result = await extractBlocks(
			[{ content: continuation, pageNumber: PAGE_NUMBER }],
			setup.dependencies,
		);
		const [opening] = result.items;

		assert.equal(opening?.heading, continuation);
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
		assert.equal(setup.calls.slice(SINGLE_CALL).join(""), LONG_SOURCE);
		assert.deepEqual(
			result.items.map((item) => item.sourceExcerpt),
			[LEFT_PARAGRAPH.trim(), RIGHT_PARAGRAPH.trim()],
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
				content.startsWith(LEFT_PARAGRAPH) ? outputFor(content) : "{broken",
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
		const pages = Array.from(
			{ length: ExtractionChunk.MAXIMUM_CONCURRENT_REQUESTS + TWO_CALLS },
			() => BLOCK,
		);
		await assert.rejects(extractBlocks(pages, setup.dependencies), denied);
		assert.equal(
			setup.calls.length,
			ExtractionChunk.MAXIMUM_CONCURRENT_REQUESTS,
		);
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
