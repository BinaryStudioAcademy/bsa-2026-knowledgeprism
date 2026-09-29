import { type GlossaryConsistencyMatchDto } from "@knowledgeprism/types";
import { describe, expect, it } from "vitest";

import { assignGlossaryMatchesToTexts } from "./assign-glossary-matches-to-texts.helper.js";

const EMPTY_LENGTH = 0;
const ONE_MATCH = 1;

const createMatch = (
	overrides: Partial<GlossaryConsistencyMatchDto> = {},
): GlossaryConsistencyMatchDto => ({
	canonicalName: "SLA",
	explanation: "Use the canonical term.",
	matchedTermId: 1,
	sourceExcerpt: "service level agreement",
	suggestedText: "SLA",
	...overrides,
});

describe("assignGlossaryMatchesToTexts", () => {
	it("assigns a match only to the text containing its sourceExcerpt", () => {
		const match = createMatch();
		const result = assignGlossaryMatchesToTexts(
			["we promise a service level agreement", "unrelated text"],
			[match],
		);

		expect(result.get("we promise a service level agreement")).toStrictEqual([
			match,
		]);
		expect(result.get("unrelated text")).toStrictEqual([]);
	});

	it("assigns a match to every text it occurs in", () => {
		const match = createMatch();
		const result = assignGlossaryMatchesToTexts(
			["first: service level agreement", "second: service level agreement"],
			[match],
		);

		expect(result.get("first: service level agreement")).toHaveLength(
			ONE_MATCH,
		);
		expect(result.get("second: service level agreement")).toHaveLength(
			ONE_MATCH,
		);
	});

	it("caches an empty array for a text with no matches", () => {
		const result = assignGlossaryMatchesToTexts(["no glossary terms here"], []);

		expect(result.get("no glossary terms here")).toHaveLength(EMPTY_LENGTH);
	});
});
