import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { ExtractionChunk } from "~/modules/knowledge-extraction/libs/constants/extraction-chunk.constant.js";

import {
	CORE_CAPABILITIES,
	CORE_CAPABILITIES_PAGE_NUMBER,
	CORE_CAPABILITIES_PAGES,
} from "../fixtures/core-capabilities.fixture.js";
import {
	LONG_TEXT_CONTENT,
	LONG_TEXT_PAGES,
	LONG_TEXT_SECTION_COUNT,
} from "../fixtures/long-text.fixture.js";
import {
	PAGE_BREAK_SECTION_PAGES,
	RELEASE_PLAN_CONTINUATION,
	RELEASE_PLAN_FIRST_PAGE,
	RELEASE_PLAN_LAST_PAGE,
} from "../fixtures/page-break-section.fixture.js";
import { buildDocumentChunks } from "./build-document-chunks.helper.js";

const FIRST_PAGE = 1;
const SECOND_PAGE = 2;
const LONG_TEXT_MINIMUM_LENGTH = 20_000;
const PLAIN_FIRST_PAGE =
	"Editors upload project documents and review the proposed sections.";
const PLAIN_SECOND_PAGE =
	"Approved sections are published to the knowledge base.";
const SMALL_CHUNK_LENGTH = 70;
const NO_CHUNKS = 0;
const PLAIN_PAGES = [
	{ content: PLAIN_FIRST_PAGE, pageNumber: FIRST_PAGE },
	{ content: PLAIN_SECOND_PAGE, pageNumber: SECOND_PAGE },
];
const SECTION_COUNT = 3;

void describe("buildDocumentChunks", () => {
	void it("keeps Core Capabilities with all its items in one chunk", () => {
		const chunks = buildDocumentChunks(CORE_CAPABILITIES_PAGES);
		const coreCapabilities = chunks.find(
			({ sectionTitle }) => sectionTitle === "Core Capabilities",
		);

		assert.ok(coreCapabilities);
		assert.equal(chunks.length, SECTION_COUNT);
		assert.equal(coreCapabilities.pageNumber, CORE_CAPABILITIES_PAGE_NUMBER);

		for (const capability of CORE_CAPABILITIES) {
			assert.equal(coreCapabilities.content.includes(capability), true);
		}
	});

	void it("keeps a section that continues on the next page in one chunk", () => {
		const releasePlan = buildDocumentChunks(PAGE_BREAK_SECTION_PAGES).find(
			({ sectionTitle }) => sectionTitle === "Release Plan",
		);

		assert.ok(releasePlan);

		const continuationOffset = releasePlan.content.indexOf(
			RELEASE_PLAN_CONTINUATION,
		);
		const continuationPage = releasePlan.pageStarts.findLast(
			({ offset }) => offset <= continuationOffset,
		);

		assert.equal(releasePlan.pageNumber, RELEASE_PLAN_FIRST_PAGE);
		assert.equal(releasePlan.pageEnd, RELEASE_PLAN_LAST_PAGE);
		assert.equal(continuationPage?.pageNumber, RELEASE_PLAN_LAST_PAGE);
	});

	void it("splits a long text document by its headings within the chunk limit", () => {
		const chunks = buildDocumentChunks(LONG_TEXT_PAGES);

		assert.equal(LONG_TEXT_CONTENT.length > LONG_TEXT_MINIMUM_LENGTH, true);
		assert.equal(chunks.length, LONG_TEXT_SECTION_COUNT);
		assert.equal(
			chunks.every(
				({ content }) => content.length <= ExtractionChunk.MAXIMUM_LENGTH,
			),
			true,
		);
	});

	void it("chunks a document without headings across its pages", () => {
		const [chunk, ...rest] = buildDocumentChunks(PLAIN_PAGES);

		assert.ok(chunk);
		assert.equal(rest.length, NO_CHUNKS);
		assert.equal(chunk.content, `${PLAIN_FIRST_PAGE}\n${PLAIN_SECOND_PAGE}`);
		assert.deepEqual(
			chunk.pageStarts.map(({ pageNumber }) => pageNumber),
			[FIRST_PAGE, SECOND_PAGE],
		);
		assert.equal(chunk.sectionIndex, null);
	});

	void it("uses the given chunk length", () => {
		const chunks = buildDocumentChunks(PLAIN_PAGES, SMALL_CHUNK_LENGTH);

		assert.deepEqual(
			chunks.map(({ content }) => content),
			[PLAIN_FIRST_PAGE, PLAIN_SECOND_PAGE],
		);
	});
});
