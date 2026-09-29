import { KnowledgeNodeType } from "@knowledgeprism/constants";

import { type ProposedPage, type ProposedSection } from "../types/types.js";

const DEFAULT_INDEX = 0;
const EMPTY_LENGTH = 0;
const LAST_INDEX_OFFSET = 1;
const MANUAL_ENTRY_CHANGE_ID = -1;
const MANUAL_PAGE_ID_PREFIX = "manual-page";
const MANUAL_SECTION_ID_PREFIX = "manual-section";
const NEW_PAGE_TITLE = "New page";
const NOT_FOUND_INDEX = -1;
const SINGLE_ITEM_COUNT = 1;

type UpdatePageParameters = {
	pageIndex: number;
	pages: ProposedSection[];
	partialPage: Partial<ProposedSection>;
};

type UpdateSectionParameters = {
	pageIndex: number;
	pages: ProposedSection[];
	partialSection: Partial<ProposedPage>;
	sectionIndex: number;
};

const isManualPage = (page: ProposedSection): boolean =>
	page.id.startsWith(MANUAL_PAGE_ID_PREFIX);

const createManualPage = (): ProposedSection => ({
	id: `${MANUAL_PAGE_ID_PREFIX}-${crypto.randomUUID()}`,
	pages: [],
	status: "created",
	title: NEW_PAGE_TITLE,
	type: KnowledgeNodeType.SECTION,
});

const createManualSection = (): ProposedPage => ({
	content: "",
	id: `${MANUAL_SECTION_ID_PREFIX}-${crypto.randomUUID()}`,
	integrationChangeId: MANUAL_ENTRY_CHANGE_ID,
	status: "created",
	title: "",
	type: KnowledgeNodeType.PAGE,
});

const addPageGroup = (pages: ProposedSection[]): ProposedSection[] => [
	...pages,
	createManualPage(),
];

const addSectionToPage = (
	pages: ProposedSection[],
	pageIndex: number,
): ProposedSection[] => {
	const targetPage = pages[pageIndex];

	if (!targetPage) {
		return pages;
	}

	const updatedPages = [...pages];

	updatedPages[pageIndex] = {
		...targetPage,
		pages: [...targetPage.pages, createManualSection()],
	};

	return updatedPages;
};

const removePageGroup = (
	pages: ProposedSection[],
	pageIndex: number,
): ProposedSection[] => {
	const targetPage = pages[pageIndex];

	if (!targetPage) {
		return pages;
	}

	return pages.filter((_page, index) => index !== pageIndex);
};

const updateSectionInPages = ({
	pageIndex,
	pages,
	partialSection,
	sectionIndex,
}: UpdateSectionParameters): ProposedSection[] => {
	const updatedPages = [...pages];
	const targetPage = updatedPages[pageIndex];

	if (!targetPage) {
		return pages;
	}

	const updatedSections = [...targetPage.pages];
	const targetSection = updatedSections[sectionIndex];

	if (!targetSection) {
		return pages;
	}

	updatedSections[sectionIndex] = {
		...targetSection,
		...partialSection,
		status:
			targetSection.status === "created" ? targetSection.status : "modified",
	};

	updatedPages[pageIndex] = {
		...targetPage,
		pages: updatedSections,
		status: targetPage.status === "created" ? targetPage.status : "modified",
	};

	return updatedPages;
};

const updatePageInPages = ({
	pageIndex,
	pages,
	partialPage,
}: UpdatePageParameters): ProposedSection[] => {
	const targetPage = pages[pageIndex];

	if (!targetPage) {
		return pages;
	}

	const updatedPages = [...pages];

	updatedPages[pageIndex] = {
		...targetPage,
		...partialPage,
		status: targetPage.status === "created" ? targetPage.status : "modified",
	};

	return updatedPages;
};

const removeSectionFromPages = ({
	activePageIndex,
	activeSectionIndex,
	pages,
}: {
	activePageIndex: number;
	activeSectionIndex: number;
	pages: ProposedSection[];
}): ProposedSection[] => {
	return pages.map((page, pageIndex) => {
		if (pageIndex !== activePageIndex) {
			return page;
		}

		return {
			...page,
			pages: page.pages.filter(
				(_section, sectionIndex) => sectionIndex !== activeSectionIndex,
			),
		};
	});
};

const clampIndex = (index: number, length: number): number =>
	Math.max(EMPTY_LENGTH, Math.min(index, length - LAST_INDEX_OFFSET));

const rejectActiveSection = ({
	activePageIndex,
	activeSectionIndex,
	pages,
}: {
	activePageIndex: number;
	activeSectionIndex: number;
	pages: ProposedSection[];
}): {
	nextPageIndex: number;
	nextPages: ProposedSection[];
	nextSectionIndex: number;
} => {
	const pageIndex =
		activePageIndex < pages.length ? activePageIndex : DEFAULT_INDEX;
	const sectionCount = pages.at(pageIndex)?.pages.length ?? EMPTY_LENGTH;
	const sectionIndex =
		activeSectionIndex < sectionCount ? activeSectionIndex : DEFAULT_INDEX;
	const nextPages = removeSectionFromPages({
		activePageIndex: pageIndex,
		activeSectionIndex: sectionIndex,
		pages,
	});

	const nextSectionIndex = clampIndex(
		sectionIndex,
		nextPages.at(pageIndex)?.pages.length ?? EMPTY_LENGTH,
	);

	return { nextPageIndex: pageIndex, nextPages, nextSectionIndex };
};

const findPageIndexBySectionId = (
	pages: ProposedSection[],
	sectionId: string,
): number =>
	pages.findIndex((page) =>
		page.pages.some((section) => section.id === sectionId),
	);

const movePageGroup = (
	pages: ProposedSection[],
	activeId: string,
	overId: string,
): ProposedSection[] => {
	const fromIndex = pages.findIndex((page) => page.id === activeId);
	const toIndex = pages.findIndex((page) => page.id === overId);

	if (
		fromIndex === NOT_FOUND_INDEX ||
		toIndex === NOT_FOUND_INDEX ||
		fromIndex === toIndex
	) {
		return pages;
	}

	const reorderedPages = [...pages];
	const [movedPage] = reorderedPages.splice(fromIndex, SINGLE_ITEM_COUNT);

	if (!movedPage) {
		return pages;
	}

	reorderedPages.splice(toIndex, EMPTY_LENGTH, movedPage);

	return reorderedPages;
};

const moveSectionAcrossPages = (
	pages: ProposedSection[],
	activeId: string,
	overId: string,
): ProposedSection[] => {
	if (activeId === overId) {
		return pages;
	}

	const sourcePageIndex = findPageIndexBySectionId(pages, activeId);
	const sourcePage = pages[sourcePageIndex];
	const movedSection = sourcePage?.pages.find(
		(section) => section.id === activeId,
	);

	if (sourcePageIndex === NOT_FOUND_INDEX || !sourcePage || !movedSection) {
		return pages;
	}

	const pagesWithoutMoved = pages.map((page, pageIndex) =>
		pageIndex === sourcePageIndex
			? {
					...page,
					pages: page.pages.filter((section) => section.id !== activeId),
				}
			: page,
	);

	const destinationPageIndexById = pagesWithoutMoved.findIndex(
		(page) => page.id === overId,
	);
	const destinationPageIndex =
		destinationPageIndexById === NOT_FOUND_INDEX
			? findPageIndexBySectionId(pagesWithoutMoved, overId)
			: destinationPageIndexById;
	const destinationPage = pagesWithoutMoved[destinationPageIndex];

	if (destinationPageIndex === NOT_FOUND_INDEX || !destinationPage) {
		return pages;
	}

	const insertionIndex =
		destinationPageIndexById === NOT_FOUND_INDEX
			? destinationPage.pages.findIndex((section) => section.id === overId)
			: destinationPage.pages.length;
	const updatedDestinationSections = [...destinationPage.pages];

	updatedDestinationSections.splice(
		insertionIndex === NOT_FOUND_INDEX
			? updatedDestinationSections.length
			: insertionIndex,
		EMPTY_LENGTH,
		movedSection,
	);

	return pagesWithoutMoved.map((page, pageIndex) =>
		pageIndex === destinationPageIndex
			? { ...page, pages: updatedDestinationSections }
			: page,
	);
};

export {
	addPageGroup,
	addSectionToPage,
	isManualPage,
	movePageGroup,
	moveSectionAcrossPages,
	rejectActiveSection,
	removePageGroup,
	removeSectionFromPages,
	updatePageInPages,
	updateSectionInPages,
};
