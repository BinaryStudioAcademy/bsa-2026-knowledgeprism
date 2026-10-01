import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
	ExtractionOutputError,
	ExtractionOutputFailure,
} from "../exceptions/extraction-output-error.exception.js";
import { mapExtractionOutput } from "./map-extraction-output.helper.js";

const PAGE_NUMBER = 16;
const INVALID_CONFIDENCE = 2;
const OVERSIZED_TITLE_LENGTH = 81;
const OWNER_ROLE = "owner";
const SOURCE_EXCERPT = `A project has an "${OWNER_ROLE}".`;
const BLOCK = {
	content: `${SOURCE_EXCERPT}\nEditors may upload documents.`,
	pageNumber: PAGE_NUMBER,
};
const ITEM = {
	confidence: 0.9,
	rationale: "Defines project ownership.",
	sourceExcerpt: SOURCE_EXCERPT,
	text: "Each project has an owner.",
	title: "Project ownership",
};

void describe("mapExtractionOutput", () => {
	void it("preserves escaped quotes and attaches the trusted page number", () => {
		assert.deepEqual(
			mapExtractionOutput(JSON.stringify({ items: [ITEM] }), BLOCK),
			[{ ...ITEM, sourcePageNumber: PAGE_NUMBER }],
		);
	});

	void it("accepts an excerpt whose line breaks differ from the page text", () => {
		const wrappedBlock = {
			content:
				"Facial recognition poses unique challenges requiring tailored\ngovernance.",
			pageNumber: PAGE_NUMBER,
		};
		const item = {
			...ITEM,
			sourceExcerpt:
				"Facial recognition poses unique challenges requiring  tailored governance.",
		};

		assert.deepEqual(mapExtractionOutput({ items: [item] }, wrappedBlock), [
			{ ...item, sourcePageNumber: PAGE_NUMBER },
		]);
	});

	void it("still rejects an excerpt that is not on the page after normalising whitespace", () => {
		assert.throws(
			() =>
				mapExtractionOutput(
					{
						items: [
							{ ...ITEM, sourceExcerpt: "Editors may delete documents." },
						],
					},
					BLOCK,
				),
			{ reason: ExtractionOutputFailure.INVALID_ITEM },
		);
	});

	void it("accepts an excerpt whose word is split by a line break on the page", () => {
		const block = {
			content:
				"Source: https://example.com/pulse/ai-a\nssistant-ends-chaos and more.",
			pageNumber: PAGE_NUMBER,
		};
		const item = {
			...ITEM,
			sourceExcerpt: "https://example.com/pulse/ai-assistant-ends-chaos",
		};

		assert.deepEqual(mapExtractionOutput({ items: [item] }, block), [
			{ ...item, sourcePageNumber: PAGE_NUMBER },
		]);
	});

	void it("accepts straight quotes and hyphens for typographic ones on the page", () => {
		const block = {
			content:
				"Responses come from the organization’s knowledge base — errors read “User is inactive”.",
			pageNumber: PAGE_NUMBER,
		};
		const item = {
			...ITEM,
			sourceExcerpt:
				"Responses come from the organization's knowledge base - errors read \u{22}User is inactive\u{22}.",
		};

		assert.deepEqual(mapExtractionOutput({ items: [item] }, block), [
			{ ...item, sourcePageNumber: PAGE_NUMBER },
		]);
	});

	void it("accepts an excerpt that joins separate lines of the page", () => {
		const block = {
			content: [
				"AI moved into production at unprecedented speed.",
				"Over 75 percent of companies deploy machine learning.",
				"Governance frameworks lag behind.",
			].join("\n"),
			pageNumber: PAGE_NUMBER,
		};
		const item = {
			...ITEM,
			sourceExcerpt:
				"AI moved into production at unprecedented speed.\nGovernance frameworks lag behind.",
		};

		assert.deepEqual(mapExtractionOutput({ items: [item] }, block), [
			{ ...item, sourcePageNumber: PAGE_NUMBER },
		]);
	});

	void it("rejects a joined excerpt when any of its lines is not on the page", () => {
		assert.throws(
			() =>
				mapExtractionOutput(
					{
						items: [
							{
								...ITEM,
								sourceExcerpt: `${SOURCE_EXCERPT}\nEditors may delete documents.`,
							},
						],
					},
					BLOCK,
				),
			{ reason: ExtractionOutputFailure.INVALID_ITEM },
		);
	});

	void it("accepts an explicitly empty result", () => {
		assert.deepEqual(
			mapExtractionOutput(JSON.stringify({ items: [] }), BLOCK),
			[],
		);
	});

	void it("classifies malformed JSON without exposing document content", () => {
		assert.throws(
			() =>
				mapExtractionOutput(`{"items":[{"text":"${SOURCE_EXCERPT}"}]}`, BLOCK),
			{
				message: "Invalid extraction output: invalid_json.",
				name: "ExtractionOutputError",
				reason: ExtractionOutputFailure.INVALID_JSON,
			},
		);
	});

	void it("rejects wrong shapes and additional properties", () => {
		for (const raw of [
			null,
			[],
			{},
			{ items: null },
			{ extra: true, items: [] },
		]) {
			assert.throws(
				() => mapExtractionOutput(raw, BLOCK),
				ExtractionOutputError,
			);
		}
	});

	void it("rejects the entire response if any item is invalid", () => {
		for (const invalid of [
			null,
			{ ...ITEM, confidence: INVALID_CONFIDENCE },
			{ ...ITEM, confidence: NaN },
			{ ...ITEM, text: " " },
			{ ...ITEM, rationale: "" },
			{ ...ITEM, title: "x".repeat(OVERSIZED_TITLE_LENGTH) },
			{ ...ITEM, title: undefined },
			{ ...ITEM, sourceExcerpt: "Not in the source" },
			{ ...ITEM, sourcePageNumber: PAGE_NUMBER },
		]) {
			assert.throws(
				() => mapExtractionOutput({ items: [ITEM, invalid] }, BLOCK),
				{
					reason: ExtractionOutputFailure.INVALID_ITEM,
				},
			);
		}
	});
});
