import { KnowledgeNodeType } from "@knowledgeprism/constants";
import { type KnowledgeTreeItemResponseDto } from "@knowledgeprism/types";

import { EMPTY_LENGTH } from "../constants/constants.js";

type ApprovedDocumentView = {
	documentId: number;
	scrollSectionId: number | undefined;
	sectionIds: number[];
};

const byPosition = (
	left: KnowledgeTreeItemResponseDto,
	right: KnowledgeTreeItemResponseDto,
): number => {
	return left.position - right.position;
};

const resolveDocument = (
	items: KnowledgeTreeItemResponseDto[],
	selected: KnowledgeTreeItemResponseDto,
): KnowledgeTreeItemResponseDto | undefined => {
	const parent =
		selected.parentId == null
			? undefined
			: items.find((item) => item.id === selected.parentId);

	if (
		selected.type === KnowledgeNodeType.ENTRY &&
		parent?.type === KnowledgeNodeType.PAGE
	) {
		return parent;
	}

	if (selected.type === KnowledgeNodeType.PAGE) {
		return selected;
	}

	return undefined;
};

const resolveApprovedDocumentView = (
	items: KnowledgeTreeItemResponseDto[],
	selectedId: number | undefined,
): ApprovedDocumentView | null => {
	if (selectedId === undefined) {
		return null;
	}

	const selected = items.find((item) => item.id === selectedId);

	if (!selected) {
		return null;
	}

	const document = resolveDocument(items, selected);

	if (!document) {
		return null;
	}

	const sectionIds = items
		.filter(
			(item) =>
				item.parentId === document.id && item.type === KnowledgeNodeType.ENTRY,
		)
		.toSorted(byPosition)
		.map((item) => item.id);

	if (sectionIds.length === EMPTY_LENGTH) {
		return null;
	}

	return {
		documentId: document.id,
		scrollSectionId: sectionIds.includes(selected.id) ? selected.id : undefined,
		sectionIds,
	};
};

export { resolveApprovedDocumentView };
