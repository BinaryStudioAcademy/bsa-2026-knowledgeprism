import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
	locateAnchoredSpan,
	locateAnchoredSpanWithRange,
	locateSourceSpan,
	locateSourceSpanWithRange,
} from "./locate-source-span.helper.js";

const GLOSSARY_PAGE = [
	"Epic 6: Glossary Engine",
	"A terminology governance system that defines canonical project terms,",
	"detects inconsistent usage, and enforces documentation consistency.",
	"1. Glossary list and terms definition (Maintain a project-level",
	"glossary of approved terminology with definitions)",
	"2. Term replacement suggestions (Recommend the approved",
	"canonical term when an inconsistency is detected)",
	"Epic 7: Ask Prism",
].join("\n");

void describe("locateSourceSpan", () => {
	void it("returns the source text for a verbatim excerpt", () => {
		assert.equal(
			locateSourceSpan(GLOSSARY_PAGE, "Epic 6: Glossary Engine"),
			"Epic 6: Glossary Engine",
		);
	});

	void it("ignores whitespace differences", () => {
		assert.equal(
			locateSourceSpan(
				GLOSSARY_PAGE,
				"defines canonical project terms, detects inconsistent usage",
			),
			"defines canonical project terms,\ndetects inconsistent usage",
		);
	});

	void it("accepts an excerpt that skips source text between its lines and returns the full source span", () => {
		const excerpt = [
			"Epic 6: Glossary Engine",
			"1. Glossary list and terms definition",
			"2. Term replacement suggestions",
		].join("\n");

		assert.equal(
			locateSourceSpan(GLOSSARY_PAGE, excerpt),
			[
				"Epic 6: Glossary Engine",
				"A terminology governance system that defines canonical project terms,",
				"detects inconsistent usage, and enforces documentation consistency.",
				"1. Glossary list and terms definition (Maintain a project-level",
				"glossary of approved terminology with definitions)",
				"2. Term replacement suggestions",
			].join("\n"),
		);
	});

	void it("rejects an excerpt with a line the source does not contain", () => {
		const excerpt = [
			"Epic 6: Glossary Engine",
			"3. Automatic glossary translation",
		].join("\n");

		assert.equal(locateSourceSpan(GLOSSARY_PAGE, excerpt), null);
	});

	void it("rejects excerpt lines that appear out of source order", () => {
		const excerpt = [
			"2. Term replacement suggestions",
			"1. Glossary list and terms definition",
		].join("\n");

		assert.equal(locateSourceSpan(GLOSSARY_PAGE, excerpt), null);
	});

	void it("matches straight quotes and hyphens against typographic ones on the page", () => {
		const page =
			"Responses come from the organization’s knowledge base — errors read “User is inactive”.";

		assert.equal(
			locateSourceSpan(
				page,
				"Responses come from the organization's knowledge base - errors read \u{22}User is inactive\u{22}.",
			),
			page,
		);
	});

	void it("matches a word that the page splits across a line break", () => {
		assert.equal(
			locateSourceSpan(
				"Source: https://example.com/pulse/ai-a\nssistant-ends-chaos and more.",
				"https://example.com/pulse/ai-assistant-ends-chaos",
			),
			"https://example.com/pulse/ai-a\nssistant-ends-chaos",
		);
	});

	void it("matches an excerpt whose line breaks differ from the page", () => {
		assert.equal(
			locateSourceSpan(
				"Editors may upload project\ndocuments and remove them.",
				"Editors may upload project documents\nand remove them.",
			),
			"Editors may upload project\ndocuments and remove them.",
		);
	});

	void it("rejects a blank excerpt", () => {
		assert.equal(locateSourceSpan(GLOSSARY_PAGE, " \n "), null);
	});

	void it("returns the source text with its exact range", () => {
		const excerpt = "Epic 6: Glossary Engine";
		const start = GLOSSARY_PAGE.indexOf(excerpt);

		assert.deepEqual(locateSourceSpanWithRange(GLOSSARY_PAGE, excerpt), {
			range: {
				end: start + excerpt.length,
				start,
			},
			text: excerpt,
		});
	});
});

void describe("locateAnchoredSpan", () => {
	void it("returns the passage between the anchors when the end anchor's punctuation differs", () => {
		assert.equal(
			locateAnchoredSpan(GLOSSARY_PAGE, {
				end: "enforces documentation consistency:",
				start: "A terminology governance system",
			}),
			[
				"A terminology governance system that defines canonical project terms,",
				"detects inconsistent usage, and enforces documentation consistency.",
			].join("\n"),
		);
	});

	void it("returns null when an anchor is not in the page", () => {
		assert.equal(
			locateAnchoredSpan(GLOSSARY_PAGE, {
				end: "a sentence that is missing",
				start: "A terminology governance system",
			}),
			null,
		);
	});

	void it("returns the anchored passage with its exact range", () => {
		const expectedText = [
			"A terminology governance system that defines canonical project terms,",
			"detects inconsistent usage, and enforces documentation consistency.",
		].join("\n");

		const start = GLOSSARY_PAGE.indexOf(expectedText);

		assert.deepEqual(
			locateAnchoredSpanWithRange(GLOSSARY_PAGE, {
				end: "enforces documentation consistency:",
				start: "A terminology governance system",
			}),
			{
				range: {
					end: start + expectedText.length,
					start,
				},
				text: expectedText,
			},
		);
	});
});
