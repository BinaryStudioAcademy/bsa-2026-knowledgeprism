import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { type GlossaryConsistencyTerm } from "../types/types.js";
import {
	findSpelledOutTerms,
	getSpelledOutForm,
} from "./find-spelled-out-terms.helper.js";

const API_TERM: GlossaryConsistencyTerm = {
	definition: "Application programming interface.",
	embedding: [],
	id: 1,
	name: "API",
};
const SLA_TERM: GlossaryConsistencyTerm = {
	definition:
		"Service level agreement: the response and resolution times we promise customers.",
	embedding: [],
	id: 2,
	name: "SLA",
};
const ONBOARDING_TERM: GlossaryConsistencyTerm = {
	definition:
		"The process of setting up a new customer account during their first two weeks.",
	embedding: [],
	id: 3,
	name: "Onboarding",
};

void describe("getSpelledOutForm", () => {
	void it("reads the definition's opening phrase when its initials spell the acronym", () => {
		assert.equal(
			getSpelledOutForm(API_TERM),
			"Application programming interface",
		);
		assert.equal(getSpelledOutForm(SLA_TERM), "Service level agreement");
	});

	void it("stops the phrase at a parenthesis and splits hyphenated words", () => {
		assert.equal(
			getSpelledOutForm({
				definition: "Application Programming Interface (API) used by partners.",
				name: "API",
			}),
			"Application Programming Interface",
		);
		assert.equal(
			getSpelledOutForm({
				definition: "Service-level agreement.",
				name: "SLA",
			}),
			"Service-level agreement",
		);
	});

	void it("returns null for non-acronym names", () => {
		assert.equal(getSpelledOutForm(ONBOARDING_TERM), null);
	});

	void it("returns null when the definition doesn't open with the spelled-out form", () => {
		assert.equal(
			getSpelledOutForm({
				definition: "The contract other systems use to call our service.",
				name: "API",
			}),
			null,
		);
	});
});

void describe("findSpelledOutTerms", () => {
	const terms = [API_TERM, SLA_TERM, ONBOARDING_TERM];

	void it("finds a spelled-out form inside a longer sentence", () => {
		assert.deepEqual(
			findSpelledOutTerms(
				"Our application programming interface lets partners create orders and check delivery status.",
				terms,
			),
			[API_TERM],
		);
	});

	void it("matches regardless of case, hyphens, line breaks and a plural", () => {
		assert.deepEqual(
			findSpelledOutTerms(
				"Every customer signs a Service-Level\nAgreement.",
				terms,
			),
			[SLA_TERM],
		);
		assert.deepEqual(
			findSpelledOutTerms(
				"We expose several application programming interfaces.",
				terms,
			),
			[API_TERM],
		);
	});

	void it("matches a hyphenated definition written with spaces", () => {
		const hyphenatedSla = {
			...SLA_TERM,
			definition: "Service-level agreement.",
		};

		assert.deepEqual(
			findSpelledOutTerms("We signed a service level agreement.", [
				hyphenatedSla,
			]),
			[hyphenatedSla],
		);
	});

	void it("ignores partial-word matches", () => {
		assert.deepEqual(
			findSpelledOutTerms("A service level agreementish clause.", terms),
			[],
		);
	});

	void it("returns nothing when the text already uses the canonical name", () => {
		assert.deepEqual(
			findSpelledOutTerms("Partners call the API and the SLA applies.", terms),
			[],
		);
	});
});
