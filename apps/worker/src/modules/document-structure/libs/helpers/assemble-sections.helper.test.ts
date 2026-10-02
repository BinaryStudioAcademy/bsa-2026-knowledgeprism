import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
	REPEATED_FACT,
	REPEATED_FACT_ITEMS,
} from "../fixtures/repeated-fact.fixture.js";
import { assembleSections } from "./assemble-sections.helper.js";

const NOT_FOUND = -1;
const SECOND_SECTION_INDEX = 1;
const SECTION_COUNT = 2;

void describe("assembleSections", () => {
	void it("keeps a fact repeated in two sections only once", () => {
		const sections = assembleSections(REPEATED_FACT_ITEMS);
		const occurrences = sections.filter(({ text }) =>
			text.includes(REPEATED_FACT),
		);

		assert.equal(sections.length, SECTION_COUNT);
		assert.equal(occurrences.length, SECTION_COUNT - SECOND_SECTION_INDEX);
	});

	void it("puts a second AI section from the same source section under a nested heading", () => {
		const [first, second] = REPEATED_FACT_ITEMS;

		if (!first || !second) {
			throw new Error("Fixture items are missing");
		}

		const [section] = assembleSections([
			first,
			{ ...second, sectionIndex: first.sectionIndex ?? null },
		]);

		assert.ok(section);
		assert.equal(section.title, first.title);
		assert.notEqual(section.text.indexOf(second.heading), NOT_FOUND);
	});
});
