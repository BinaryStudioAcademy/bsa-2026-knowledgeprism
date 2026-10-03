import { getOrderedDescendants } from "@knowledgeprism/config";
import { KnowledgeNodeType } from "@knowledgeprism/constants";
import { type KnowledgeTreeItemResponseDto } from "@knowledgeprism/types";

import { EMPTY_LENGTH } from "../constants/constants.js";

type ApprovedDocumentView = {
	documentId: number;
	sectionIds: number[];
};

const resolveApprovedDocumentView = (
	items: KnowledgeTreeItemResponseDto[],
	selectedId: number | undefined,
): ApprovedDocumentView | null => {
	if (selectedId === undefined) {
		return null;
	}

	const document = items.find((item) => item.id === selectedId);

	if (document?.type !== KnowledgeNodeType.PAGE) {
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
		sectionIds,
	};
};

export { resolveApprovedDocumentView };
