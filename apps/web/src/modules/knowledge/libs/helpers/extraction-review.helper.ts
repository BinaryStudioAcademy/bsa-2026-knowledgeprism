import { type ExtractionItemResponseDto } from "@knowledgeprism/types";

import { type ProposedSection } from "../types/types.js";

type ExtractionItemPatch = {
	id: number;
	text: string;
	title: string;
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

const findExtractionItemPatch = (
	page: ProposedSection["pages"][number],
	itemsById: Map<number, ExtractionItemResponseDto>,
): ExtractionItemPatch | null => {
	const id = parseExtractionItemId(page.id);

	if (id === null) {
		return null;
	}

	const original = itemsById.get(id);

	if (!original) {
		return null;
	}

	const title = page.title.trim();
	const text = page.content.trim();

	if (title === original.title.trim() && text === original.text.trim()) {
		return null;
	}

	return { id, text, title };
};

const collectExtractionItemPatches = (
	pages: ProposedSection[],
	extractionItems: ExtractionItemResponseDto[],
): ExtractionItemPatch[] => {
	const itemsById = new Map(extractionItems.map((item) => [item.id, item]));
	const patches: ExtractionItemPatch[] = [];

	for (const section of pages) {
		for (const page of section.pages) {
			const patch = findExtractionItemPatch(page, itemsById);

			if (patch) {
				patches.push(patch);
			}
		}
	}

	return patches;
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

export { collectExtractionItemPatches, deriveExtractionReviewIds };
