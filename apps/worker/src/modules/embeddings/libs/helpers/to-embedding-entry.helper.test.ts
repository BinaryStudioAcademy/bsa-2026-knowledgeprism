import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { toEmbeddingEntry } from "./to-embedding-entry.helper.js";

const TITLE = "Pricing";
const PARAGRAPH = "Business costs 15 EUR per technician per month.";

void describe("toEmbeddingEntry", () => {
	void it("builds the same text for a new section and an existing node", () => {
		const section = toEmbeddingEntry({
			blocks: [
				{
					content: [{ text: TITLE, type: "text" }],
					props: { level: 2 },
					type: "heading",
				},
				{ content: [{ text: PARAGRAPH, type: "text" }], type: "paragraph" },
			],
			title: TITLE,
		});
		const node = toEmbeddingEntry({
			blocks: [
				{
					children: [],
					content: [{ styles: {}, text: PARAGRAPH, type: "text" }],
					id: "block-1",
					props: { textAlignment: "left" },
					type: "paragraph",
				},
			],
			title: TITLE,
		});

		assert.deepEqual(section, node);
		assert.deepEqual(section, { text: PARAGRAPH, title: TITLE });
	});

	void it("keeps a first heading that differs from the title", () => {
		const entry = toEmbeddingEntry({
			blocks: [
				{ content: [{ text: "Plans", type: "text" }], type: "heading" },
				{ content: [{ text: PARAGRAPH, type: "text" }], type: "paragraph" },
			],
			title: TITLE,
		});

		assert.equal(entry.text, `Plans ${PARAGRAPH}`);
	});
});
