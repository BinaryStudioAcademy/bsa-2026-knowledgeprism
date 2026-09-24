import { KnowledgeNodeType } from "@knowledgeprism/constants";
import { type KnowledgeTreeItemResponseDto } from "@knowledgeprism/types";
import React, { useCallback, useMemo, useState } from "react";
import { tv } from "tailwind-variants";

import { Icon } from "~/components/icon/icon.js";

import {
	EMPTY_LENGTH,
	KNOWLEDGE_TREE_ITEM_CONFIG,
} from "../../libs/constants/constants.js";
import { HighlightedText } from "./highlighted-text.js";
import {
	handleHorizontalNavigation,
	handleVerticalNavigation,
} from "./knowledge-tree-keyboard-navigation.js";

const {
	BASE_PADDING,
	DEFAULT_LEVEL,
	LEVEL_INCREMENT,
	LEVEL_MULTIPLIER,
	TAB_INDEX_FOCUSABLE,
	TAB_INDEX_UNFOCUSABLE,
} = KNOWLEDGE_TREE_ITEM_CONFIG;

type Properties = {
	focusedNodeId?: number | undefined;
	item: KnowledgeTreeItemResponseDto;
	itemsByParentId: Map<null | number, KnowledgeTreeItemResponseDto[]>;
	level?: number | undefined;
	onFocus: (id: number) => void;
	onSelect: (id: number) => void;
	searchQuery?: string | undefined;
	selectedId?: number | undefined;
};

const treeItemVariants = tv({
	base: "flex w-full cursor-pointer items-center gap-2 rounded-[7px] px-2.5 py-2 text-sm transition-colors",
	variants: {
		isSelected: {
			false: "text-text-muted hover:bg-secondary",
			true: "bg-secondary font-medium text-text",
		},
	},
});

const KnowledgeTreeItem: React.FC<Properties> = ({
	focusedNodeId,
	item,
	itemsByParentId,
	level = DEFAULT_LEVEL,
	onFocus,
	onSelect,
	searchQuery = "",
	selectedId,
}: Properties) => {
	const children = useMemo(
		() => itemsByParentId.get(item.id) ?? [],
		[itemsByParentId, item.id],
	);

	const hasChildren = children.length > EMPTY_LENGTH;
	const isFolder = item.type === KnowledgeNodeType.SECTION || hasChildren;
	const isSelected = selectedId === item.id;
	const isFocused = focusedNodeId === item.id;
	const isSearching = searchQuery.trim() !== "";
	const [isManuallyExpanded, setIsManuallyExpanded] = useState(true);

	const isExpanded = isSearching || isManuallyExpanded;

	const handleToggle = useCallback(
		(event_: React.MouseEvent) => {
			event_.stopPropagation();
			if (isFolder) {
				if (!isSearching) {
					setIsManuallyExpanded((previous) => !previous);
				}
			} else {
				onSelect(item.id);
			}
			onFocus(item.id);
		},
		[isFolder, item.id, onSelect, onFocus, isSearching],
	);

	const handleKeyDown = useCallback(
		(event_: React.KeyboardEvent<HTMLButtonElement>) => {
			if (event_.key === "ArrowRight" || event_.key === "ArrowLeft") {
				handleHorizontalNavigation({
					children,
					event_,
					isExpanded,
					isSearching,
					isSection: isFolder,
					item,
					onFocus,
					setIsExpanded: setIsManuallyExpanded,
				});
				return;
			}

			if (event_.key === "ArrowDown" || event_.key === "ArrowUp") {
				event_.preventDefault();
				handleVerticalNavigation(item.id, event_.key, onFocus);
			}
		},
		[isFolder, isExpanded, isSearching, children, item, onFocus],
	);

	const paddingValue = level * LEVEL_MULTIPLIER + BASE_PADDING;
	const paddingLeftString = `${String(paddingValue)}px`;

	return (
		<div className="flex flex-col gap-0.5" role="none">
			<button
				aria-expanded={isFolder && hasChildren ? isExpanded : undefined}
				aria-level={level + LEVEL_INCREMENT}
				aria-owns={
					isFolder && isExpanded && hasChildren
						? `group-${String(item.id)}`
						: undefined
				}
				aria-selected={isFolder ? undefined : isSelected}
				className={treeItemVariants({ isSelected })}
				data-id={item.id}
				onClick={handleToggle}
				onKeyDown={handleKeyDown}
				role="treeitem"
				style={{ paddingLeft: paddingLeftString }}
				tabIndex={isFocused ? TAB_INDEX_FOCUSABLE : TAB_INDEX_UNFOCUSABLE}
				type="button"
			>
				{isFolder ? (
					<Icon aria-hidden="true" name="folder" size={13} />
				) : (
					<Icon aria-hidden="true" name="file-rounded" size={12} />
				)}
				<HighlightedText highlight={searchQuery} text={item.title} />
			</button>

			{isFolder && isExpanded && hasChildren && (
				<div
					className="flex flex-col gap-0.5"
					id={`group-${String(item.id)}`}
					role="group"
				>
					{children.map((child) => (
						<KnowledgeTreeItem
							focusedNodeId={focusedNodeId}
							item={child}
							itemsByParentId={itemsByParentId}
							key={child.id}
							level={level + LEVEL_INCREMENT}
							onFocus={onFocus}
							onSelect={onSelect}
							searchQuery={searchQuery}
							selectedId={selectedId}
						/>
					))}
				</div>
			)}
		</div>
	);
};

export { KnowledgeTreeItem };
