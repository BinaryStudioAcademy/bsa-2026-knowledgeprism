import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { ExtractionRecovery } from "../constants/extraction-recovery.constant.js";
import { splitTruncatedChunk } from "./split-truncated-chunk.helper.js";

const REPETITIONS = 8;
const LONG_STATEMENT_LENGTH = 700;
const RULE =
	"Access is denied unless the project owner explicitly approves the request.";
const PADDING = "Background information. ".repeat(REPETITIONS);

void describe("splitTruncatedChunk", () => {
	void it("prefers paragraph boundaries and preserves original whitespace", () => {
		const first = `${PADDING}${RULE}\r\n\r\n`;
		const second = `${PADDING}Final statement.`;
		const source = first + second;
		const parts = splitTruncatedChunk(source);
		assert.deepEqual(parts, [first, second]);
		assert.equal(parts.join(""), source);
	});

	void it("keeps a rule crossing the midpoint intact when splitting sentences", () => {
		const source = `${PADDING}${RULE} ${PADDING}`;
		const parts = splitTruncatedChunk(source);
		assert.ok(parts);
		assert.equal(parts.join(""), source);
		assert.ok(parts.some((part) => part.includes(RULE)));
		assert.ok(
			parts.every(
				(part) =>
					part.length >=
					source.length * ExtractionRecovery.MINIMUM_CHILD_FRACTION,
			),
		);
	});

	void it("does not treat a wrapped source line as the end of a statement", () => {
		const source = `${"x".repeat(LONG_STATEMENT_LENGTH)} requires approval\nfrom the project owner.`;
		assert.equal(splitTruncatedChunk(source), null);
	});

	void it("leaves an indivisible sentence incomplete instead of slicing words", () => {
		assert.equal(
			splitTruncatedChunk(
				`${"x".repeat(LONG_STATEMENT_LENGTH)} requires approval.`,
			),
			null,
		);
	});

	void it("rejects splits that would leave almost all input in one child", () => {
		assert.equal(
			splitTruncatedChunk(`Heading.\n\n${"x".repeat(LONG_STATEMENT_LENGTH)}`),
			null,
		);
	});
});
