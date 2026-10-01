const getTreeItemElement = (id: number): HTMLElement | null => {
	return document.querySelector(
		`#knowledge-tree-root [data-id="${CSS.escape(String(id))}"]`,
	);
};
export { getTreeItemElement };
