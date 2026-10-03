import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { alignTranslatedText } from "~/modules/translation/libs/helpers/align-translated-text.helper.js";

import { type ExtractionDependencies } from "../types/extraction-dependencies.type.js";
import { extractChunk } from "./extract-chunk.helper.js";

const PAGE_NUMBER = 1;
const CHUNK_INDEX = 0;
const EXPECTED_ITEM_COUNT = 1;
const FIRST_ITEM_INDEX = 0;

const ORIGINAL_CONTENT = [
	"Übersicht",
	"Das Limit ist 10.",
	"Erstellen Sie ein Backup.",
	"Verwenden Sie Postgres.",
	"Einrichtung",
].join("\n");

const TRANSLATED_CONTENT = [
	"Overview",
	"The limit is 10.",
	"Keep a backup.",
	"Use Postgres.",
	"Setup",
].join("\n");

const createDependencies = (
	invoke: ExtractionDependencies["invoke"],
): ExtractionDependencies => ({
	context: {},
	invoke,
	logger: {
		debug: () => {},
		error: () => {},
		info: () => {},
		warn: () => {},
	},
	pause: () => Promise.resolve(),
});

void describe("extractChunk", () => {
	void it("uses translated content for extraction and grounds the source in original content", async () => {
		let invokedContent: string | undefined;

		const dependencies = createDependencies((content) => {
			invokedContent = content;

			return Promise.resolve({
				items: [
					{
						blocks: [
							{
								content: [
									{
										styles: {},
										text: "Overview",
										type: "text",
									},
								],
								props: {
									level: 2,
								},
								type: "heading",
							},
							{
								content: [
									{
										styles: {},
										text: "The limit is 10.",
										type: "text",
									},
								],
								type: "paragraph",
							},
						],
						confidence: 0.9,
						heading: "Overview",
						order: 1,
						sourceExcerpt: "The limit is 10.",
					},
				],
			});
		});

		const result = await extractChunk(
			{
				chunkIndex: CHUNK_INDEX,
				content: TRANSLATED_CONTENT,
				originalContent: ORIGINAL_CONTENT,
				pageNumber: PAGE_NUMBER,
				sourceMappings: alignTranslatedText(
					ORIGINAL_CONTENT,
					TRANSLATED_CONTENT,
				),
			},
			dependencies,
		);

		assert.equal(invokedContent, TRANSLATED_CONTENT);
		assert.equal(result.hasFailures, false);
		assert.equal(result.items.length, EXPECTED_ITEM_COUNT);
		assert.equal(
			result.items[FIRST_ITEM_INDEX]?.sourceExcerpt,
			"Das Limit ist 10.",
		);
	});
});
