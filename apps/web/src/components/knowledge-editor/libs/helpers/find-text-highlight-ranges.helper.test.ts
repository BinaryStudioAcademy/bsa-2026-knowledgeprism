import { BlockNoteEditor, type PartialBlock } from "@blocknote/core";
import { describe, expect, it } from "vitest";

import { TextHighlightVariant } from "../enums/enums.js";
import { type TextHighlight } from "../types/types.js";
import { findTextHighlightRanges } from "./find-text-highlight-ranges.helper.js";

const NO_MATCHES = 0;
const ONE_MATCH = 1;
const TWO_MATCHES = 2;
const FIRST_RANGE_INDEX = 0;
const DOC_START_POS = 0;
const FALLBACK_POS = 0;

const createDocument = (initialContent: PartialBlock[]) => {
	const editor = BlockNoteEditor.create({ initialContent });
	const container = document.createElement("div");

	editor.mount(container);

	return editor.prosemirrorState.doc;
};

const createHighlight = (text: string, id = text): TextHighlight => ({
	id,
	text,
	variant: TextHighlightVariant.SUGGESTION,
});

describe("findTextHighlightRanges", () => {
	it("finds a plain match in a single paragraph", () => {
		const document_ = createDocument([
			{ content: "Use the API to fetch data.", type: "paragraph" },
		]);
		const ranges = findTextHighlightRanges(document_, [createHighlight("API")]);

		expect(ranges).toHaveLength(ONE_MATCH);
		expect(
			document_.textBetween(
				ranges[FIRST_RANGE_INDEX]?.from ?? FALLBACK_POS,
				ranges[FIRST_RANGE_INDEX]?.to ?? FALLBACK_POS,
			),
		).toBe("API");
	});

	it("finds a match spanning bold and plain text nodes", () => {
		const document_ = createDocument([
			{
				content: [
					{ styles: { bold: true }, text: "application ", type: "text" },
					{ styles: {}, text: "programming interface", type: "text" },
				],
				type: "paragraph",
			},
		]);
		const ranges = findTextHighlightRanges(document_, [
			createHighlight("application programming interface"),
		]);

		expect(ranges).toHaveLength(ONE_MATCH);
		expect(
			document_.textBetween(
				ranges[FIRST_RANGE_INDEX]?.from ?? FALLBACK_POS,
				ranges[FIRST_RANGE_INDEX]?.to ?? FALLBACK_POS,
			),
		).toBe("application programming interface");
	});

	it("highlights only the first occurrence when a phrase occurs twice", () => {
		const document_ = createDocument([
			{ content: "API first, then API again.", type: "paragraph" },
		]);
		const ranges = findTextHighlightRanges(document_, [createHighlight("API")]);

		expect(ranges).toHaveLength(ONE_MATCH);
		expect(
			document_.textBetween(
				ranges[FIRST_RANGE_INDEX]?.from ?? FALLBACK_POS,
				ranges[FIRST_RANGE_INDEX]?.to ?? FALLBACK_POS,
			),
		).toBe("API");
		expect(
			document_.textBetween(
				DOC_START_POS,
				ranges[FIRST_RANGE_INDEX]?.from ?? FALLBACK_POS,
			),
		).not.toContain("API");
	});

	it("finds a match in the second block and in a nested child block", () => {
		const document_ = createDocument([
			{ content: "Nothing here.", type: "paragraph" },
			{ content: "Refer to the API for details.", type: "paragraph" },
			{
				children: [{ content: "A nested API mention.", type: "paragraph" }],
				content: "Parent block.",
				type: "paragraph",
			},
		]);
		const ranges = findTextHighlightRanges(document_, [
			createHighlight("API", "second-block"),
			createHighlight("nested API", "nested-block"),
		]);

		expect(ranges).toHaveLength(TWO_MATCHES);

		const foundTexts = ranges.map((range) =>
			document_.textBetween(range.from, range.to),
		);

		expect(foundTexts).toContain("API");
		expect(foundTexts).toContain("nested API");
	});

	it("returns nothing when the text is not found", () => {
		const document_ = createDocument([
			{ content: "No relevant terms here.", type: "paragraph" },
		]);
		const ranges = findTextHighlightRanges(document_, [
			createHighlight("nonexistent phrase"),
		]);

		expect(ranges).toHaveLength(NO_MATCHES);
	});

	it("drops a later highlight that overlaps an earlier one", () => {
		const document_ = createDocument([
			{ content: "The application programming interface.", type: "paragraph" },
		]);
		const ranges = findTextHighlightRanges(document_, [
			createHighlight("application programming interface", "long"),
			createHighlight("programming", "short"),
		]);

		expect(ranges).toHaveLength(ONE_MATCH);
		expect(ranges[FIRST_RANGE_INDEX]?.id).toBe("long");
	});

	it("skips a highlight with empty text", () => {
		const document_ = createDocument([
			{ content: "Some content.", type: "paragraph" },
		]);
		const ranges = findTextHighlightRanges(document_, [createHighlight("")]);

		expect(ranges).toHaveLength(NO_MATCHES);
	});
});
