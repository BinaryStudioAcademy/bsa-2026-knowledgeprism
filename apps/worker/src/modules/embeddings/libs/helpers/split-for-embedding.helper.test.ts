import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { EmbeddingChunk } from "../constants/embedding-chunk.constant.js";
import { splitForEmbedding } from "./split-for-embedding.helper.js";

const LONG_SENTENCE_REPETITIONS = 60;
const SINGLE_CHUNK_COUNT = 1;
const TITLE = "Release Plan";

void describe("splitForEmbedding", () => {
	void it("keeps a short entry in one chunk that starts with its title", () => {
		const chunks = splitForEmbedding({
			text: "M1 Internal alpha on 30 October 2026.",
			title: TITLE,
		});

		const [chunk] = chunks;

		assert.equal(chunks.length, SINGLE_CHUNK_COUNT);
		assert.equal(chunk, `${TITLE}\nM1 Internal alpha on 30 October 2026.`);
	});

	void it("splits a long entry into chunks under the limit, each with the title", () => {
		const text = "The team reviews every proposal before approval. ".repeat(
			LONG_SENTENCE_REPETITIONS,
		);
		const chunks = splitForEmbedding({ text, title: TITLE });

		assert.equal(chunks.length > SINGLE_CHUNK_COUNT, true);
		assert.equal(
			chunks.every(
				(chunk) =>
					chunk.length <= EmbeddingChunk.MAXIMUM_LENGTH &&
					chunk.startsWith(`${TITLE}\n`),
			),
			true,
		);
	});
});
