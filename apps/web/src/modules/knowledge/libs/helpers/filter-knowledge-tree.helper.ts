import { type KnowledgeTreeItemResponseDto } from "@knowledgeprism/types";

import { EMPTY_LENGTH } from "../constants/constants.js";

const filterKnowledgeTree = (
	items: KnowledgeTreeItemResponseDto[],
	searchQuery: string,
): KnowledgeTreeItemResponseDto[] => {
	if (!searchQuery.trim()) {
		return items;
	}

	const lowerQuery = searchQuery.trim().toLowerCase();

	const matchingIds = new Set<number>();
	const directMatches = new Set<number>();

	for (const item of items) {
		if (!item.title.toLowerCase().includes(lowerQuery)) {
			continue;
		}
		directMatches.add(item.id);
		matchingIds.add(item.id);
	}

	for (const id of directMatches) {
		let current = items.find((item) => item.id === id)?.parentId ?? null;
		while (current !== null) {
			matchingIds.add(current);
			current = items.find((item) => item.id === current)?.parentId ?? null;
		}
	}

	const queue = [...directMatches];
	while (queue.length > EMPTY_LENGTH) {
		const currentId = queue.shift();
		if (currentId === undefined) {
			continue;
		}

		const children = items.filter(
			(item) => item.parentId === currentId && !matchingIds.has(item.id),
		);
		for (const child of children) {
			matchingIds.add(child.id);
			queue.push(child.id);
		}
	}

	return items.filter((item) => matchingIds.has(item.id));
};

export { filterKnowledgeTree };
