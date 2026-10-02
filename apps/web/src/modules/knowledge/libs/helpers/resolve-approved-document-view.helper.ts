import { getOrderedDescendants } from "@knowledgeprism/config";
import { KnowledgeNodeType } from "@knowledgeprism/constants";
import { type KnowledgeTreeItemResponseDto } from "@knowledgeprism/types";

import { EMPTY_LENGTH } from "../constants/constants.js";

type ApprovedDocumentView = {
	documentId: number;
	scrollSectionId: number | undefined;
	sectionIds: number[];
};

const resolveDocument = (
	items: KnowledgeTreeItemResponseDto[],
	selected: KnowledgeTreeItemResponseDto,
): KnowledgeTreeItemResponseDto | undefined => {
	const byId = new Map(items.map((item) => [item.id, item]));
	const visited = new Set<number>();
	let current: KnowledgeTreeItemResponseDto | undefined = selected;

	while (current && !visited.has(current.id)) {
		if (current.type === KnowledgeNodeType.PAGE) {
			return current;
		}

		if (current.type !== KnowledgeNodeType.ENTRY || current.parentId === null) {
			return undefined;
		}

		visited.add(current.id);
		current = byId.get(current.parentId);
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

	const sectionIds = getOrderedDescendants(
		items.filter((item) => item.type === KnowledgeNodeType.ENTRY),
		document.id,
	).map((item) => item.id);

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
