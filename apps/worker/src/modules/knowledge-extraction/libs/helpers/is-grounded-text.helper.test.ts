import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
	createSourceVocabulary,
	isGroundedText,
} from "./is-grounded-text.helper.js";

const SOURCE = [
	"Approval requirements",
	"A reviewer approves each proposal before it is published.",
	"Uploads are limited to 20 MB per file.",
	"Epic 10: Feedback",
	"Epic 13: Billing",
	"Decision: approved knowledge stays in the project knowledge base.",
].join("\n");

const vocabulary = createSourceVocabulary(SOURCE);

void describe("isGroundedText", () => {
	void it("accepts text copied from the source", () => {
		assert.equal(
			isGroundedText(
				"A reviewer approves each proposal before it is published.",
				vocabulary,
			),
			true,
		);
	});

	void it("accepts rewording that keeps the source's words", () => {
		assert.equal(
			isGroundedText(
				"Each proposal is approved by a reviewer before publishing.",
				vocabulary,
			),
			true,
		);
	});

	void it("rejects a sentence the source does not contain", () => {
		assert.equal(
			isGroundedText(
				"Administrators can export every proposal to a spreadsheet for auditing.",
				vocabulary,
			),
			false,
		);
	});

	void it("rejects a number the source does not state", () => {
		assert.equal(
			isGroundedText("Uploads are limited to 50 MB per file.", vocabulary),
			false,
		);
	});

	void it("rejects an invented heading even when it is short", () => {
		assert.equal(isGroundedText("Key takeaways", vocabulary), false);
	});

	void it("accepts a heading taken from the source", () => {
		assert.equal(isGroundedText("Approval requirements", vocabulary), true);
	});

	void it("accepts a plural of a source word", () => {
		assert.equal(isGroundedText("Epics 10–13", vocabulary), true);
	});
});
