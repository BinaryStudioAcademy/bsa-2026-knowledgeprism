import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
	hasLeadingHeading,
	readPreviousHeading,
} from "./read-previous-heading.helper.js";

void describe("readPreviousHeading", () => {
	void it("uses a markdown heading when the chunk ends on one", () => {
		assert.equal(
			readPreviousHeading("Body\n\n## How it works\n"),
			"How it works",
		);
	});

	void it("uses the last heading when its section is still open at the chunk end", () => {
		assert.equal(
			readPreviousHeading(
				"## Setup\nInstall the agent.\n## Limits\nThe limit is 10.",
			),
			"Limits",
		);
	});

	void it("returns null when the chunk has no heading", () => {
		assert.equal(readPreviousHeading("Installation\nThe limit is 10."), null);
	});
});

void describe("hasLeadingHeading", () => {
	void it("detects a chunk that opens with a markdown heading", () => {
		assert.equal(hasLeadingHeading("\n## Setup\nInstall the agent."), true);
		assert.equal(hasLeadingHeading("Install the agent.\n## Setup"), false);
	});
});
