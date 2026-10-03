import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { createTranslatedChunk } from "./create-translated-chunk.helper.js";

const parent = {
	content: "Overview\nThe limit is 10.\nKeep a backup.",
	originalContent: "Übersicht\nDas Limit ist 10.\nErstellen Sie ein Backup.",
	pageNumber: 1,
	sourceMappings: [
		{
			source: {
				end: 28,
				start: 10,
			},
			target: {
				end: 25,
				start: 9,
			},
		},
	],
	sourceRange: {
		end: 43,
		start: 0,
	},
};

void describe("createTranslatedChunk", () => {
	void it("creates source metadata for a translated child chunk", () => {
		const result = createTranslatedChunk(parent, "The limit is 10.");

		assert.equal(result.content, "The limit is 10.");
		assert.ok(result.originalContent);
		assert.equal(result.originalContent.trim(), "Das Limit ist 10.");

		assert.deepEqual(result.sourceMappings, [
			{
				source: {
					end: 18,
					start: 0,
				},
				target: {
					end: 16,
					start: 0,
				},
			},
		]);

		assert.deepEqual(result.sourceRange, {
			end: 28,
			start: 10,
		});
	});
});
