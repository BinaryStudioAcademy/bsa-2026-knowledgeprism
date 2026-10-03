import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { GlossaryExtractionLimit } from "../constants/glossary-extraction.constant.js";
import { extractTermsByChunk } from "./extract-terms-by-chunk.helper.js";

const FILLER = "Editors upload project documents for review. ";
const DEFINITION = "SLA means service level agreement.\n\n";
const FILLER_REPETITIONS = Math.floor(
	(GlossaryExtractionLimit.CONTENT_CHARACTERS - DEFINITION.length) /
		FILLER.length,
);
const FIRST_PART = `${DEFINITION}${FILLER.repeat(FILLER_REPETITIONS)}`;
const LAST_PART = "RPO means recovery point objective. SLA appears again here.";
const LONG_CONTENT = `${FIRST_PART}\n\n${LAST_PART}`;
const SINGLE_CALL = 1;
const TWO_CALLS = 2;
const FIRST_CALL = 0;
const SECOND_CALL = 1;

const TERMS = [
	{ definition: "Service level agreement.", name: "SLA" },
	{ definition: "Recovery point objective.", name: "RPO" },
];

const createInvoke = () => {
	const calls: { content: string; existingNames: readonly string[] }[] = [];
	const invoke = (
		content: string,
		existingNames: readonly string[],
	): Promise<unknown> => {
		calls.push({ content, existingNames });

		return Promise.resolve(
			JSON.stringify(TERMS.filter(({ name }) => content.includes(name))),
		);
	};

	return { calls, invoke };
};

void describe("extractTermsByChunk", () => {
	void it("finds terms defined after the first chunk of a long document", async () => {
		const { calls, invoke } = createInvoke();

		const terms = await extractTermsByChunk({
			content: LONG_CONTENT,
			existingNames: [],
			invoke,
		});

		assert.equal(calls.length, TWO_CALLS);
		assert.ok(
			calls.every(
				({ content }) =>
					content.length <= GlossaryExtractionLimit.CONTENT_CHARACTERS,
			),
		);
		assert.deepEqual(terms, TERMS);
	});

	void it("tells later chunks which terms were already found", async () => {
		const { calls, invoke } = createInvoke();

		await extractTermsByChunk({
			content: LONG_CONTENT,
			existingNames: ["API"],
			invoke,
		});

		assert.deepEqual(calls[FIRST_CALL]?.existingNames, ["API"]);
		assert.deepEqual(calls[SECOND_CALL]?.existingNames, ["API", "SLA"]);
	});

	void it("makes one call for a short document and none for an empty one", async () => {
		const short = createInvoke();
		const empty = createInvoke();

		await extractTermsByChunk({
			content: LAST_PART,
			existingNames: [],
			invoke: short.invoke,
		});
		await extractTermsByChunk({
			content: "  \n ",
			existingNames: [],
			invoke: empty.invoke,
		});

		assert.equal(short.calls.length, SINGLE_CALL);
		assert.deepEqual(empty.calls, []);
	});
});
