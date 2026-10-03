import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
	ENGLISH_TEXT,
	FRENCH_TEXT,
	UKRAINIAN_TEXT,
} from "~/modules/document-structure/libs/fixtures/non-english.fixture.js";

import { isEnglishText } from "./is-english-text.helper.js";

void describe("isEnglishText", () => {
	void it("skips translation for English text", () => {
		assert.equal(isEnglishText(ENGLISH_TEXT), true);
	});

	void it("translates Ukrainian and French text", () => {
		assert.equal(isEnglishText(UKRAINIAN_TEXT), false);
		assert.equal(isEnglishText(FRENCH_TEXT), false);
	});
});
