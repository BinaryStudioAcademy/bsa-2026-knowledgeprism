import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { EXTRACTION_SYSTEM_PROMPT } from "./extraction-prompt.constant.js";

const REQUIRED_RULES = [
	"Do not answer from outside the chunk.",
	"Do not add an example, a warning, a definition, or a recommendation the chunk does not contain.",
	"If the chunk has headings, use those headings.",
	"a heading is only a topic that already has more than one point under it",
	"Do not turn the chunk into a summary, key points, action items, a brief, a briefing, an FAQ, or a study guide.",
	"wording, grammar, and list shape may change so it reads clearly. The idea may not.",
	"Drop boilerplate and repetition",
	"Do not drop a whole section because a template has no slot for it.",
	"One idea per block.",
	"Parallel named items become one list. The name is a bold text run, then the explanation is the next text run.",
	"Use a callout only when the source itself is a decision, a warning, or a note.",
	"copied character-for-character from inside <page>",
	"Design reference from the source document (page 8)",
	"If the same passage appears twice, write it once.",
	"A table of named rows becomes that same list.",
	"Keep a scope label such as MVP or Post-MVP",
	"A user flow stays a numbered list of steps.",
	"Do not add a toggle or a page link.",
	"Ordinary prose stays paragraphs.",
	"the heading is Field verification",
] as const;

void describe("EXTRACTION_SYSTEM_PROMPT", () => {
	void it("states the page rules on the one extraction call", () => {
		for (const rule of REQUIRED_RULES) {
			assert.equal(EXTRACTION_SYSTEM_PROMPT.includes(rule), true, rule);
		}
	});
});
