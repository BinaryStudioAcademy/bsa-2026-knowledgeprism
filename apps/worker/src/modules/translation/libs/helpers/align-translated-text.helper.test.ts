import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
	alignTranslatedText,
	mapTranslatedRangeToSourceRange,
} from "./align-translated-text.helper.js";

void describe("alignTranslatedText", () => {
	void it("aligns translated sentences with original sentences", () => {
		const original = "Das Limit ist 10. Erstellen Sie ein Backup.";
		const translated = "The limit is 10. Create a backup.";

		assert.deepEqual(alignTranslatedText(original, translated), [
			{
				source: {
					end: 18,
					start: 0,
				},
				target: {
					end: 17,
					start: 0,
				},
			},
			{
				source: {
					end: 43,
					start: 18,
				},
				target: {
					end: 33,
					start: 17,
				},
			},
		]);
	});

	void it("returns an empty array for empty content", () => {
		assert.deepEqual(alignTranslatedText("", ""), []);
	});

	void it("maps a translated range to the corresponding original range", () => {
		const mappings = alignTranslatedText(
			"Das Limit ist 10. Erstellen Sie ein Backup.",
			"The limit is 10. Create a backup.",
		);

		const result = mapTranslatedRangeToSourceRange(mappings, {
			end: 33,
			start: 17,
		});

		assert.deepEqual(result, {
			end: 43,
			start: 18,
		});
	});

	void it("maps a translated excerpt back to the original text", () => {
		const original = [
			"Übersicht",
			"Das Limit ist 10.",
			"Erstellen Sie ein Backup.",
		].join("\n");

		const translated = [
			"Overview",
			"The limit is 10.",
			"Create a backup.",
		].join("\n");

		const mappings = alignTranslatedText(original, translated);

		const translatedStart = translated.indexOf("The limit is 10.");
		const translatedEnd = translatedStart + "The limit is 10.".length;

		const result = mapTranslatedRangeToSourceRange(mappings, {
			end: translatedEnd,
			start: translatedStart,
		});

		assert.ok(result);

		assert.equal(
			original.slice(result.start, result.end).trim(),
			"Das Limit ist 10.",
		);
	});
});
