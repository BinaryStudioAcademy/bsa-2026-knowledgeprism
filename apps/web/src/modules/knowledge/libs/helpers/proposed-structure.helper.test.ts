import { KnowledgeNodeType } from "@knowledgeprism/constants";
import { describe, expect, it } from "vitest";

import { type ProposedSection } from "../types/types.js";
import {
	addPageGroup,
	addSectionToPage,
	isManualPage,
	movePageGroup,
	moveSectionAcrossPages,
	removePageGroup,
} from "./proposed-structure.helper.js";

const EMPTY_ITEM_COUNT = 0;
const FIRST_PAGE_INDEX = 0;
const ITEM_COUNT_AFTER_ADDING_ONE = 4;
const THIRD_ITEM_ID = 3;
const LAST_INDEX_OFFSET = 1;
const LAST_ITEM_OFFSET = -1;
const OUT_OF_RANGE_PAGE_INDEX = 5;
const SECOND_PAGE_INDEX = 1;

const createPages = (): ProposedSection[] => [
	{
		id: "source-page-1",
		pages: [
			{
				content: "First content",
				id: "1",
				integrationChangeId: 1,
				status: "created",
				title: "First item",
				type: KnowledgeNodeType.PAGE,
			},
			{
				content: "Second content",
				id: "2",
				integrationChangeId: 2,
				status: "created",
				title: "Second item",
				type: KnowledgeNodeType.PAGE,
			},
			{
				content: "Third content",
				id: "3",
				integrationChangeId: THIRD_ITEM_ID,
				status: "created",
				title: "Third item",
				type: KnowledgeNodeType.PAGE,
			},
		],
		status: "created",
		title: "Extracted from Page 1",
		type: KnowledgeNodeType.SECTION,
	},
	{
		id: "source-page-2",
		pages: [
			{
				content: "Fourth content",
				id: "4",
				integrationChangeId: 4,
				status: "created",
				title: "Fourth item",
				type: KnowledgeNodeType.PAGE,
			},
		],
		status: "created",
		title: "Extracted from Page 2",
		type: KnowledgeNodeType.SECTION,
	},
];

describe("addPageGroup", () => {
	it("appends a new empty manual page group", () => {
		const pages = createPages();
		const nextPages = addPageGroup(pages);

		expect(nextPages).toHaveLength(pages.length + LAST_INDEX_OFFSET);
		const [newPage] = nextPages.slice(LAST_ITEM_OFFSET);
		expect(newPage?.pages).toHaveLength(EMPTY_ITEM_COUNT);
		expect(newPage && isManualPage(newPage)).toBe(true);
	});
});

describe("addSectionToPage", () => {
	it("appends a new manual item to the target page", () => {
		const pages = createPages();
		const nextPages = addSectionToPage(pages, FIRST_PAGE_INDEX);

		expect(nextPages[FIRST_PAGE_INDEX]?.pages).toHaveLength(
			ITEM_COUNT_AFTER_ADDING_ONE,
		);
		expect(nextPages[FIRST_PAGE_INDEX]?.pages.at(LAST_ITEM_OFFSET)?.title).toBe(
			"",
		);
	});

	it("returns the same reference for an out-of-range page index", () => {
		const pages = createPages();
		expect(addSectionToPage(pages, OUT_OF_RANGE_PAGE_INDEX)).toBe(pages);
	});
});

describe("removePageGroup", () => {
	it("removes an empty page group", () => {
		const pages = addPageGroup(createPages());
		const emptyPageIndex = pages.length - LAST_INDEX_OFFSET;
		const nextPages = removePageGroup(pages, emptyPageIndex);

		expect(nextPages).toHaveLength(pages.length - LAST_INDEX_OFFSET);
	});

	it("removes a page group with items", () => {
		const pages = createPages();
		const nextPages = removePageGroup(pages, FIRST_PAGE_INDEX);

		expect(nextPages).toHaveLength(pages.length - LAST_INDEX_OFFSET);
		expect(nextPages.map((page) => page.id)).toEqual(["source-page-2"]);
	});

	it("is a no-op when the target page is missing", () => {
		const pages = createPages();

		expect(removePageGroup(pages, OUT_OF_RANGE_PAGE_INDEX)).toBe(pages);
	});
});

describe("movePageGroup", () => {
	it("reorders two page groups", () => {
		const pages = createPages();
		const nextPages = movePageGroup(pages, "source-page-2", "source-page-1");

		expect(nextPages.map((page) => page.id)).toEqual([
			"source-page-2",
			"source-page-1",
		]);
	});

	it("is a no-op when either id is unknown", () => {
		const pages = createPages();
		expect(movePageGroup(pages, "source-page-1", "missing")).toBe(pages);
	});
});

describe("moveSectionAcrossPages", () => {
	it("reorders items within the same page", () => {
		const pages = createPages();
		const nextPages = moveSectionAcrossPages(pages, "2", "1");

		expect(
			nextPages[FIRST_PAGE_INDEX]?.pages.map((section) => section.id),
		).toEqual(["2", "1", "3"]);
	});

	it("moves an item down by one position within the same page", () => {
		const pages = createPages();
		const nextPages = moveSectionAcrossPages(pages, "1", "2");

		expect(
			nextPages[FIRST_PAGE_INDEX]?.pages.map((section) => section.id),
		).toEqual(["2", "1", "3"]);
	});

	it("moves an item down by two positions within the same page", () => {
		const pages = createPages();
		const nextPages = moveSectionAcrossPages(pages, "1", "3");

		expect(
			nextPages[FIRST_PAGE_INDEX]?.pages.map((section) => section.id),
		).toEqual(["2", "3", "1"]);
	});

	it("moves an item into a different page, positioned before the target item", () => {
		const pages = createPages();
		const nextPages = moveSectionAcrossPages(pages, "1", "4");

		expect(
			nextPages[FIRST_PAGE_INDEX]?.pages.map((section) => section.id),
		).toEqual(["2", "3"]);
		expect(
			nextPages[SECOND_PAGE_INDEX]?.pages.map((section) => section.id),
		).toEqual(["1", "4"]);
	});

	it("appends an item to the end of a page when dropped on the page itself", () => {
		const pages = createPages();
		const nextPages = moveSectionAcrossPages(pages, "1", "source-page-2");

		expect(
			nextPages[SECOND_PAGE_INDEX]?.pages.map((section) => section.id),
		).toEqual(["4", "1"]);
	});

	it("is a no-op when active and over ids are the same", () => {
		const pages = createPages();
		expect(moveSectionAcrossPages(pages, "1", "1")).toBe(pages);
	});
});
