import { type GlossaryConsistencyMatchDto } from "@knowledgeprism/types";
import { describe, expect, it } from "vitest";

import { TextHighlightVariant } from "~/components/knowledge-editor/libs/enums/enums.js";

import {
	toGlossaryHighlightId,
	toGlossaryHighlights,
} from "./to-glossary-highlights.helper.js";

const NO_HIGHLIGHTS = 0;
const ONE_HIGHLIGHT = 1;
const FIRST_INDEX = 0;

const createMatch = (
	overrides: Partial<GlossaryConsistencyMatchDto> = {},
): GlossaryConsistencyMatchDto => ({
	canonicalName: "API",
	explanation: "Use the canonical term.",
	matchedTermId: 1,
	sourceExcerpt: "application programming interface",
	suggestedText: "API",
	...overrides,
});

describe("toGlossaryHighlights", () => {
	it("returns an empty array for no matches", () => {
		expect(toGlossaryHighlights([])).toHaveLength(NO_HIGHLIGHTS);
	});

	it("maps a match to a suggestion highlight keyed by sourceExcerpt", () => {
		const match = createMatch();
		const highlights = toGlossaryHighlights([match]);

		expect(highlights).toHaveLength(ONE_HIGHLIGHT);
		expect(highlights[FIRST_INDEX]).toStrictEqual({
			id: toGlossaryHighlightId(match),
			text: match.sourceExcerpt,
			variant: TextHighlightVariant.SUGGESTION,
		});
	});

	it("builds a stable id from matchedTermId and sourceExcerpt", () => {
		const match = createMatch({ matchedTermId: 42, sourceExcerpt: "app" });

		expect(toGlossaryHighlightId(match)).toBe("42:app");
	});

	it("maps multiple matches in order", () => {
		const firstMatch = createMatch({ sourceExcerpt: "app" });
		const secondMatch = createMatch({
			matchedTermId: 2,
			sourceExcerpt: "programming interface",
		});
		const highlights = toGlossaryHighlights([firstMatch, secondMatch]);

		expect(highlights.map((highlight) => highlight.text)).toStrictEqual([
			"app",
			"programming interface",
		]);
	});
});
