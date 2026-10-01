import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { appendIncomingAtSpan } from "./append-incoming-at-span.helper.js";

void describe("appendIncomingAtSpan", () => {
	void it("inserts the incoming text after the matching span", () => {
		assert.equal(
			appendIncomingAtSpan(
				"Keep the old limit of 10.",
				"The limit is now 12.",
				"old limit",
			),
			"Keep the old limit\n\nThe limit is now 12. of 10.",
		);
	});

	void it("appends when the span is not in the live text", () => {
		assert.equal(
			appendIncomingAtSpan("Live text.", "Incoming text.", "missing"),
			"Live text.\n\nIncoming text.",
		);
	});

	void it("leaves the live text unchanged when the incoming text is already there", () => {
		assert.equal(
			appendIncomingAtSpan(
				"Live text.\n\nIncoming text.",
				"Incoming text.",
				"Live",
			),
			"Live text.\n\nIncoming text.",
		);
	});
});
