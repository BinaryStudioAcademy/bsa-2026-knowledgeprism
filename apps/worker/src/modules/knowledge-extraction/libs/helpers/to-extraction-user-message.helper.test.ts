import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { toExtractionUserMessage } from "./to-extraction-user-message.helper.js";

const CHUNK = "Overview";

void describe("toExtractionUserMessage", () => {
	void it("wraps the chunk in page tags", () => {
		assert.equal(
			toExtractionUserMessage(CHUNK, null),
			`<page>\n${CHUNK}\n</page>`,
		);
	});

	void it("places previous_heading before page when the previous chunk ended on a heading", () => {
		assert.equal(
			toExtractionUserMessage(CHUNK, "Installation"),
			`<previous_heading>Installation</previous_heading>\n<page>\n${CHUNK}\n</page>`,
		);
	});
});
