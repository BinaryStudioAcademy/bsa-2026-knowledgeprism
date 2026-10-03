import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { type GlossaryConsistencyMatch } from "../types/types.js";
import { toUniqueMatches } from "./to-unique-matches.helper.js";

const CONTENT =
	"The client signs the contract. Later the client pays the invoice.";
const CLIENT_TERM_ID = 1;
const INVOICE_TERM_ID = 2;

const toMatch = (
	matchedTermId: number,
	sourceExcerpt: string,
): GlossaryConsistencyMatch => ({
	canonicalName: "Client",
	explanation: "Uses a different name for the term.",
	matchedTermId,
	sourceExcerpt,
	suggestedText: "the Client",
});

void describe("toUniqueMatches", () => {
	void it("keeps one match when two parts return the same term and excerpt", () => {
		const match = toMatch(CLIENT_TERM_ID, "the client");

		assert.deepEqual(toUniqueMatches([match, { ...match }], CONTENT), [match]);
	});

	void it("keeps matches for different terms on the same excerpt", () => {
		const clientMatch = toMatch(CLIENT_TERM_ID, "the invoice");
		const invoiceMatch = toMatch(INVOICE_TERM_ID, "the invoice");

		assert.deepEqual(toUniqueMatches([clientMatch, invoiceMatch], CONTENT), [
			clientMatch,
			invoiceMatch,
		]);
	});

	void it("drops a match whose excerpt is not in the full content", () => {
		const match = toMatch(CLIENT_TERM_ID, "the customer");

		assert.deepEqual(toUniqueMatches([match], CONTENT), []);
	});
});
