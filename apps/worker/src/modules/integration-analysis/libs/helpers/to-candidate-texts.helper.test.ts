import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { toCandidateTexts } from "./to-candidate-texts.helper.js";

const LONG_CONTENT_REPETITIONS = 200;
const MATCH_SCORE = 0.9;

void describe("toCandidateTexts", () => {
	void it("gives the classifier the whole node text, not the matching chunk", () => {
		const content = "Each release adds checklist templates. ".repeat(
			LONG_CONTENT_REPETITIONS,
		);
		const [text] = toCandidateTexts([
			{ item: { content, id: 1, title: "Release Plan" }, score: MATCH_SCORE },
		]);

		assert.equal(text?.includes(content), true);
	});
});
