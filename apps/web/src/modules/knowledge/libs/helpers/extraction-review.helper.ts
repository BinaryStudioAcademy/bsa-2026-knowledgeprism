import { KnowledgeNodeType } from "@knowledgeprism/constants";
import {
	type ExtractionItemResponseDto,
	type ExtractionItemsReviewRequestDto,
	type ExtractionSectionResponseDto,
} from "@knowledgeprism/types";

import { type ProposedSection } from "../types/types.js";

const EMPTY_LENGTH = 0;
const EXTRACTION_SECTION_ID_PREFIX = "source-page";

const toProposedPage = (
	item: ExtractionItemResponseDto,
): ProposedSection["pages"][number] => ({
	content: item.text,
	id: String(item.id),
	integrationChangeId: item.id,
	sourceExcerpt: item.sourceExcerpt,
	sourcePageNumber: item.sourcePageNumber,
	status: "created",
	title: item.title,
	type: KnowledgeNodeType.PAGE,
});

const sortPagesByItemPosition = (
	pages: ProposedSection["pages"],
	itemPositionById: Map<number, number>,
): ProposedSection["pages"] =>
	pages.toSorted((pageA, pageB) => {
		const positionA = itemPositionById.get(Number(pageA.id)) ?? EMPTY_LENGTH;
		const positionB = itemPositionById.get(Number(pageB.id)) ?? EMPTY_LENGTH;

		return positionA - positionB;
	});

const mapExtractionItemsToProposedStructure = (
	extractionItems: ExtractionItemResponseDto[],
	extractionSections: ExtractionSectionResponseDto[] = [],
): ProposedSection[] => {
	const sectionsById = new Map<
		number,
		{
			pages: ProposedSection["pages"];
			position: number;
			title: string;
		}
	>();

	for (const section of extractionSections) {
		sectionsById.set(section.id, {
			pages: [],
			position: section.position,
			title: section.title,
		});
	}

	const unsectionedItemsByPage = new Map<number, ProposedSection["pages"]>();

	for (const item of extractionItems) {
		const sectionId = item.extractionSectionId;

		if (sectionId === null) {
			const pages = unsectionedItemsByPage.get(item.sourcePageNumber) ?? [];

			pages.push(toProposedPage(item));
			unsectionedItemsByPage.set(item.sourcePageNumber, pages);
			continue;
		}

		const section = sectionsById.get(sectionId) ?? {
			pages: [],
			position: item.sectionPosition ?? item.sourcePageNumber,
			title:
				item.sectionTitle ??
				`Extracted from Page ${String(item.sourcePageNumber)}`,
		};

		section.pages.push(toProposedPage(item));
		sectionsById.set(sectionId, section);
	}

	const itemPositionById = new Map(
		extractionItems.map((item) => [item.id, item.position]),
	);

	const savedSections = [...sectionsById]
		.toSorted(
			([, sectionA], [, sectionB]) => sectionA.position - sectionB.position,
		)
		.map(([sectionId, section]) => ({
			id: String(sectionId),
			pages: sortPagesByItemPosition(section.pages, itemPositionById),
			status: "created" as const,
			title: section.title,
			type: KnowledgeNodeType.SECTION,
		}));

	const unsectionedGroups = [...unsectionedItemsByPage]
		.toSorted(([pageA], [pageB]) => pageA - pageB)
		.map(([pageNumber, pages]) => ({
			id: `${EXTRACTION_SECTION_ID_PREFIX}-${String(pageNumber)}`,
			pages: sortPagesByItemPosition(pages, itemPositionById),
			status: "created" as const,
			title: `Extracted from Page ${String(pageNumber)}`,
			type: KnowledgeNodeType.SECTION,
		}));

	return [...savedSections, ...unsectionedGroups];
};

const parseExtractionItemId = (pageId: string): null | number => {
	const parsed = Number(pageId);

	return Number.isFinite(parsed) ? parsed : null;
};

const collectApprovedExtractionItemIds = (
	pages: ProposedSection[],
): number[] => {
	const ids: number[] = [];

	for (const section of pages) {
		for (const page of section.pages) {
			const id = parseExtractionItemId(page.id);

			if (id !== null) {
				ids.push(id);
			}
		}
	}

	return ids;
};

const deriveExtractionReviewIds = (
	pages: ProposedSection[],
	extractionItems: ExtractionItemResponseDto[],
): { approvedIds: number[]; rejectedIds: number[] } => {
	const approvedIds = collectApprovedExtractionItemIds(pages);
	const allItemIds = extractionItems.map((item) => item.id);
	const rejectedIds = allItemIds.filter((id) => !approvedIds.includes(id));

	return { approvedIds, rejectedIds };
};

const toExtractionReviewPayload = (
	pages: ProposedSection[],
	extractionItems: ExtractionItemResponseDto[],
): ExtractionItemsReviewRequestDto => {
	const { approvedIds, rejectedIds } = deriveExtractionReviewIds(
		pages,
		extractionItems,
	);
	const nonEmptySections = pages.filter(
		(section) => section.pages.length > EMPTY_LENGTH,
	);

	return {
		approvedIds,
		rejectedIds,
		sections: nonEmptySections.map((section) => ({
			items: section.pages.map((page) => {
				const id = parseExtractionItemId(page.id);

				return {
					...(id !== null && { id }),
					text: page.content,
					title: page.title,
				};
			}),
			title: section.title,
		})),
	};
};

export { mapExtractionItemsToProposedStructure, toExtractionReviewPayload };
