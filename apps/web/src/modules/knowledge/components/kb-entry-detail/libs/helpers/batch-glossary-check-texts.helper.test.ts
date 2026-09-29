import { describe, expect, it } from "vitest";

import { batchGlossaryCheckTexts } from "./batch-glossary-check-texts.helper.js";

const JOIN_SEPARATOR = "\n\n";
const ONE_BATCH = 1;
const TWO_BATCHES = 2;
const FIRST_INDEX = 0;
const SECOND_INDEX = 1;
const GENEROUS_LIMIT = 100;
const TIGHT_LIMIT = 10;
const MEDIUM_LIMIT = 25;
const EXACT_FIT_LIMIT = 12;

describe("batchGlossaryCheckTexts", () => {
	it("returns no batches for no texts", () => {
		expect(
			batchGlossaryCheckTexts([], GENEROUS_LIMIT, JOIN_SEPARATOR),
		).toStrictEqual([]);
	});

	it("puts texts that fit together into a single batch", () => {
		const batches = batchGlossaryCheckTexts(
			["first block", "second block"],
			GENEROUS_LIMIT,
			JOIN_SEPARATOR,
		);

		expect(batches).toHaveLength(ONE_BATCH);
		expect(batches[FIRST_INDEX]).toStrictEqual(["first block", "second block"]);
	});

	it("starts a new batch once the joined length would exceed the limit", () => {
		const batches = batchGlossaryCheckTexts(
			["aaaaa", "bbbbb"],
			TIGHT_LIMIT,
			JOIN_SEPARATOR,
		);

		expect(batches).toHaveLength(TWO_BATCHES);
		expect(batches[FIRST_INDEX]).toStrictEqual(["aaaaa"]);
		expect(batches[SECOND_INDEX]).toStrictEqual(["bbbbb"]);
	});

	it("drops a text that alone exceeds the limit, keeping the rest batched", () => {
		const batches = batchGlossaryCheckTexts(
			["short", "way too long for the limit", "also short"],
			MEDIUM_LIMIT,
			JOIN_SEPARATOR,
		);

		expect(batches).toHaveLength(ONE_BATCH);
		expect(batches[FIRST_INDEX]).toStrictEqual(["short", "also short"]);
	});

	it("keeps request count minimal by filling each batch as much as possible", () => {
		const batches = batchGlossaryCheckTexts(
			["12345", "12345", "12345"],
			EXACT_FIT_LIMIT,
			JOIN_SEPARATOR,
		);

		expect(batches).toHaveLength(TWO_BATCHES);
		expect(batches[FIRST_INDEX]).toStrictEqual(["12345", "12345"]);
		expect(batches[SECOND_INDEX]).toStrictEqual(["12345"]);
	});
});
