type HierarchyItem = {
	id: number;
	parentId: null | number;
	position: number;
};

const getOrderedDescendants = <Item extends HierarchyItem>(
	items: readonly Item[],
	parentId: number,
): Item[] => {
	const childrenByParentId = new Map<number, Item[]>();

	for (const item of items) {
		if (item.parentId === null) {
			continue;
		}
		const children = childrenByParentId.get(item.parentId) ?? [];
		children.push(item);
		childrenByParentId.set(item.parentId, children);
	}

	for (const children of childrenByParentId.values()) {
		children.sort(
			(left, right) => left.position - right.position || left.id - right.id,
		);
	}

	const pending = (childrenByParentId.get(parentId) ?? []).toReversed();
	const descendants: Item[] = [];
	const visited = new Set([parentId]);

	for (let item = pending.pop(); item; item = pending.pop()) {
		if (visited.has(item.id)) {
			continue;
		}
		visited.add(item.id);
		descendants.push(item);
		pending.push(...(childrenByParentId.get(item.id) ?? []).toReversed());
	}

	return descendants;
};

export { getOrderedDescendants };
