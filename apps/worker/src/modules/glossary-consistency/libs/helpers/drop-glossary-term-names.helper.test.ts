import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
	type GlossaryConsistencyMatch,
	type GlossaryConsistencyTerm,
} from "../types/types.js";
import { dropGlossaryTermNames } from "./drop-glossary-term-names.helper.js";

const CLIENT_TERM: GlossaryConsistencyTerm = {
	definition: "A company that buys the product.",
	embedding: [],
	id: 1,
	name: "Client",
};
const CUSTOMER_TERM: GlossaryConsistencyTerm = {
	definition: "A person who uses the product.",
	embedding: [],
	id: 2,
	name: "customer",
};

const toClientMatch = (sourceExcerpt: string): GlossaryConsistencyMatch => ({
	canonicalName: "Client",
	explanation: "Refers to the client without using its canonical name.",
	matchedTermId: CLIENT_TERM.id,
	sourceExcerpt,
	suggestedText: "the Client",
});

void describe("dropGlossaryTermNames", () => {
	void it("drops a match whose text is the name of another glossary term", () => {
		const matches = [toClientMatch("the Customer")];

		assert.deepEqual(
			dropGlossaryTermNames(matches, [CLIENT_TERM, CUSTOMER_TERM]),
			[],
		);
	});

	void it("drops a match whose text is the plural of another glossary term", () => {
		const matches = [toClientMatch("customers")];

		assert.deepEqual(
			dropGlossaryTermNames(matches, [CLIENT_TERM, CUSTOMER_TERM]),
			[],
		);
	});

	void it("keeps a match when no other glossary term has that name", () => {
		const matches = [toClientMatch("the buyer")];

		assert.deepEqual(
			dropGlossaryTermNames(matches, [CLIENT_TERM, CUSTOMER_TERM]),
			matches,
		);
	});

	void it("keeps a casing fix for the matched term itself", () => {
		const matches = [toClientMatch("client")];

		assert.deepEqual(
			dropGlossaryTermNames(matches, [CLIENT_TERM, CUSTOMER_TERM]),
			matches,
		);
	});

	void it("keeps a match whose text only contains another glossary term", () => {
		const matches = [toClientMatch("the customer account owner")];

		assert.deepEqual(
			dropGlossaryTermNames(matches, [CLIENT_TERM, CUSTOMER_TERM]),
			matches,
		);
	});
});
