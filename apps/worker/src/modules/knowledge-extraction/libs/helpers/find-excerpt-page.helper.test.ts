import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { findExcerptPage } from "./find-excerpt-page.helper.js";

const PAGE_NUMBER = 1;
const NEXT_PAGE_NUMBER = 2;
const LINE_BREAK_LENGTH = 1;

void describe("findExcerptPage", () => {
	void it("uses original page offsets when the excerpt is in original content", () => {
		const originalSecondPageText = "Seite zwei Regel.";
		const originalContent = `Seite eins Text.\n${originalSecondPageText}`;
		const translatedContent = "Page one text.\nPage two rule.";

		const pageNumber = findExcerptPage(
			{
				content: translatedContent,
				originalContent,
				originalPageStarts: [
					{ offset: 0, pageNumber: PAGE_NUMBER },
					{
						offset: "Seite eins Text.".length + LINE_BREAK_LENGTH,
						pageNumber: NEXT_PAGE_NUMBER,
					},
				],
				pageNumber: PAGE_NUMBER,
				pageStarts: [{ offset: 0, pageNumber: PAGE_NUMBER }],
			},
			originalSecondPageText,
		);

		assert.equal(pageNumber, NEXT_PAGE_NUMBER);
	});
});
