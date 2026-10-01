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
