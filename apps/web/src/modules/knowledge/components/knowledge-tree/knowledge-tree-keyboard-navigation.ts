import type React from "react";

import {
	EMPTY_LENGTH,
	INDEX_OFFSET,
	LAST_INDEX_OFFSET,
	MIN_INDEX,
	NOT_FOUND_INDEX,
} from "../../libs/constants/constants.js";
import { type KnowledgeTreeItemResponseDto } from "../../libs/mock-knowledge-tree.js";

type HorizontalNavigationConfig = {
	children: KnowledgeTreeItemResponseDto[];
	event_: React.KeyboardEvent<HTMLButtonElement>;
	isExpanded: boolean;
	isSearching: boolean;
	isSection: boolean;
	item: KnowledgeTreeItemResponseDto;
	onFocus: (id: number) => void;
	setIsExpanded: (isExpanded: boolean) => void;
};

const focusNodeById = (id: number): void => {
	const treeRoot = document.querySelector("#knowledge-tree-root");
	const node = treeRoot?.querySelector<HTMLElement>(
		`[data-id='${CSS.escape(String(id))}']`,
	);
	if (node) {
		node.focus();
	}
};

const handleVerticalNavigation = (
	currentId: number,
	direction: "ArrowDown" | "ArrowUp",
	onFocus: (id: number) => void,
): void => {
	const treeRoot = document.querySelector("#knowledge-tree-root");
	const nodes = [
		...(treeRoot?.querySelectorAll<HTMLElement>("[role='treeitem']") ?? []),
	];
	const currentIndex = nodes.findIndex(
		(node) => node.dataset["id"] === String(currentId),
	);

	if (currentIndex !== NOT_FOUND_INDEX) {
		const nextIndex =
			direction === "ArrowDown"
				? Math.min(
						currentIndex + INDEX_OFFSET,
						nodes.length - LAST_INDEX_OFFSET,
					)
				: Math.max(currentIndex - INDEX_OFFSET, MIN_INDEX);

		const nextNode = nodes[nextIndex];
		if (nextNode?.dataset["id"]) {
			const nextId = Number(nextNode.dataset["id"]);
			onFocus(nextId);
			nextNode.focus();
		}
	}
};

const handleArrowRight = ({
	children,
	event_,
	isExpanded,
	isSection,
	onFocus,
	setIsExpanded,
}: HorizontalNavigationConfig): void => {
	if (!isSection) {
		return;
	}

	if (!isExpanded) {
		setIsExpanded(true);
		event_.preventDefault();
		return;
	}

	if (children.length > EMPTY_LENGTH) {
		const [firstChild] = children;
		if (firstChild) {
			onFocus(firstChild.id);
			focusNodeById(firstChild.id);
			event_.preventDefault();
		}
	}
};

const handleArrowLeft = ({
	event_,
	isExpanded,
	isSearching,
	isSection,
	item,
	onFocus,
	setIsExpanded,
}: HorizontalNavigationConfig): void => {
	if (isSection && isExpanded && !isSearching) {
		setIsExpanded(false);
		event_.preventDefault();
		return;
	}

	if (item.parentId) {
		onFocus(item.parentId);
		focusNodeById(item.parentId);
		event_.preventDefault();
	}
};

const handleHorizontalNavigation = (
	config: HorizontalNavigationConfig,
): void => {
	if (config.event_.key === "ArrowRight") {
		handleArrowRight(config);
	} else if (config.event_.key === "ArrowLeft") {
		handleArrowLeft(config);
	}
};

export { handleHorizontalNavigation, handleVerticalNavigation };
