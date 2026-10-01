import { KnowledgeNodeType } from "@knowledgeprism/constants";
import { type KnowledgeTreeItemResponseDto } from "@knowledgeprism/types";
import React, { useCallback, useMemo, useState } from "react";
import { tv } from "tailwind-variants";

import { Icon } from "~/components/icon/icon.js";

import {
	EMPTY_LENGTH,
	KNOWLEDGE_TREE_ITEM_CONFIG,
} from "../../libs/constants/constants.js";
import { type DocumentPlacement } from "../../libs/helpers/helpers.js";
import { HighlightedText } from "./highlighted-text.js";
import { KnowledgeTreeDocumentActions } from "./knowledge-tree-document-actions.js";
import {
	handleHorizontalNavigation,
	handleVerticalNavigation,
} from "./knowledge-tree-keyboard-navigation.js";

const {
	BASE_PADDING,
	CHEVRON_ICON_SIZE,
	DEFAULT_LEVEL,
	LEVEL_INCREMENT,
	LEVEL_MULTIPLIER,
	TAB_INDEX_FOCUSABLE,
	TAB_INDEX_UNFOCUSABLE,
} = KNOWLEDGE_TREE_ITEM_CONFIG;

type Properties = {
	canStructure?: boolean | undefined;
	focusedNodeId?: number | undefined;
	isStructurePending?: boolean | undefined;
	item: KnowledgeTreeItemResponseDto;
	itemsByParentId: Map<null | number, KnowledgeTreeItemResponseDto[]>;
	level?: number | undefined;
	onCreateDocument?: ((title: string, parentId: number) => void) | undefined;
	onFocus: (id: number) => void;
	onMoveDocument?:
		((id: number, placement: DocumentPlacement) => void) | undefined;
	onSelect: (id: number) => void;
	searchQuery?: string | undefined;
	selectedId?: number | undefined;
	treeItems?: KnowledgeTreeItemResponseDto[] | undefined;
};

const treeItemVariants = tv({
	base: "flex min-w-0 flex-1 cursor-pointer items-center gap-2 rounded-[7px] px-2.5 py-2 text-left text-sm transition-colors",
	variants: {
		isSelected: {
			false: "text-text-muted hover:bg-secondary",
			true: "bg-secondary font-medium text-text",
		},
	},
});

const KnowledgeTreeItem: React.FC<Properties> = ({
	canStructure = false,
	focusedNodeId,
	isStructurePending = false,
	item,
	itemsByParentId,
	level = DEFAULT_LEVEL,
	onCreateDocument,
	onFocus,
	onMoveDocument,
	onSelect,
	searchQuery = "",
	selectedId,
	treeItems = [],
}: Properties) => {
	const children = useMemo(
		() => itemsByParentId.get(item.id) ?? [],
		[itemsByParentId, item.id],
	);

	const hasChildren = children.length > EMPTY_LENGTH;
	const isSelected = selectedId === item.id;
	const isFocused = focusedNodeId === item.id;
	const isSearching = searchQuery.trim() !== "";
	const [isManuallyExpanded, setIsManuallyExpanded] = useState(true);
	const isExpanded = isSearching || isManuallyExpanded;

	const handleSelect = useCallback((): void => {
		onSelect(item.id);
		onFocus(item.id);
	}, [item.id, onFocus, onSelect]);

	const handleExpand = useCallback(
		(event_: React.MouseEvent<HTMLButtonElement>): void => {
			event_.preventDefault();
			event_.stopPropagation();

			if (!isSearching) {
				setIsManuallyExpanded((previous) => !previous);
			}

			onFocus(item.id);
		},
		[isSearching, item.id, onFocus],
	);

	const handleKeyDown = useCallback(
		(event_: React.KeyboardEvent<HTMLButtonElement>) => {
			if (event_.key === "ArrowRight" || event_.key === "ArrowLeft") {
				handleHorizontalNavigation({
					children,
					event_,
					isExpanded,
					isSearching,
					isSection: hasChildren,
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
		[hasChildren, isExpanded, isSearching, children, item, onFocus],
	);

	const paddingValue = level * LEVEL_MULTIPLIER + BASE_PADDING;
	const paddingLeftString = `${String(paddingValue)}px`;
	const expandLabel = isExpanded
		? `Collapse ${item.title}`
		: `Expand ${item.title}`;
	const documentActions =
		onCreateDocument &&
		onMoveDocument &&
		canStructure &&
		isSelected &&
		!isSearching ? (
			<KnowledgeTreeDocumentActions
				isPending={isStructurePending}
				itemId={item.id}
				items={treeItems}
				onCreateDocument={onCreateDocument}
				onMoveDocument={onMoveDocument}
			/>
		) : null;

	return (
		<div className="flex flex-col gap-0.5" role="none">
			<div
				className="flex items-center gap-0.5"
				style={{ paddingLeft: paddingLeftString }}
			>
				{hasChildren ? (
					<button
						aria-label={expandLabel}
						className="flex size-6 shrink-0 items-center justify-center rounded text-text-muted hover:bg-secondary"
						onClick={handleExpand}
						type="button"
					>
						<span
							className={isExpanded ? "inline-flex rotate-90" : "inline-flex"}
						>
							<Icon
								aria-hidden="true"
								name="chevron-filled-right"
								size={CHEVRON_ICON_SIZE}
							/>
						</span>
					</button>
				) : (
					<span aria-hidden="true" className="size-6 shrink-0" />
				)}
				<button
					aria-expanded={hasChildren ? isExpanded : undefined}
					aria-level={level + LEVEL_INCREMENT}
					aria-owns={
						hasChildren && isExpanded ? `group-${String(item.id)}` : undefined
					}
					aria-selected={isSelected}
					className={treeItemVariants({ isSelected })}
					data-id={item.id}
					onClick={handleSelect}
					onKeyDown={handleKeyDown}
					role="treeitem"
					tabIndex={isFocused ? TAB_INDEX_FOCUSABLE : TAB_INDEX_UNFOCUSABLE}
					type="button"
				>
					{item.type === KnowledgeNodeType.SECTION ? (
						<Icon aria-hidden="true" name="folder" size={13} />
					) : (
						<Icon aria-hidden="true" name="file-rounded" size={12} />
					)}
					<HighlightedText highlight={searchQuery} text={item.title} />
				</button>
			</div>

			{documentActions}

			{hasChildren && isExpanded && (
				<div
					className="flex flex-col gap-0.5"
					id={`group-${String(item.id)}`}
					role="group"
				>
					{children.map((child) => (
						<KnowledgeTreeItem
							canStructure={canStructure}
							focusedNodeId={focusedNodeId}
							isStructurePending={isStructurePending}
							item={child}
							itemsByParentId={itemsByParentId}
							key={child.id}
							level={level + LEVEL_INCREMENT}
							onCreateDocument={onCreateDocument}
							onFocus={onFocus}
							onMoveDocument={onMoveDocument}
							onSelect={onSelect}
							searchQuery={searchQuery}
							selectedId={selectedId}
							treeItems={treeItems}
						/>
					))}
				</div>
			)}
		</div>
	);
};

export { KnowledgeTreeItem };
