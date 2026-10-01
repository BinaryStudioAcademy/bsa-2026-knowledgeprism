import { type KnowledgeTreeItemResponseDto } from "@knowledgeprism/types";
import React, { useCallback, useMemo, useState } from "react";
import { tv } from "tailwind-variants";

import { Icon } from "~/components/icon/icon.js";

import {
	EMPTY_LENGTH,
	KNOWLEDGE_TREE_ITEM_CONFIG,
} from "../../libs/constants/constants.js";
import {
	type DocumentPlacement,
	DropZone,
	isDocumentNode,
} from "../../libs/helpers/helpers.js";
import { HighlightedText } from "./highlighted-text.js";
import { type KnowledgeTreeDrag } from "./knowledge-tree-drag.js";
import {
	handleHorizontalNavigation,
	handleVerticalNavigation,
} from "./knowledge-tree-keyboard-navigation.js";
import { KnowledgeTreeRowActions } from "./knowledge-tree-row-actions.js";

const DRAG_GRIP_ICON_SIZE = 10;
const NODE_ICON_SIZE = 13;

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
	drag?: KnowledgeTreeDrag | undefined;
	focusedNodeId?: number | undefined;
	isStructurePending?: boolean | undefined;
	item: KnowledgeTreeItemResponseDto;
	itemsByParentId: Map<null | number, KnowledgeTreeItemResponseDto[]>;
	level?: number | undefined;
	onCreateDocument?: ((title: string, parentId: number) => void) | undefined;
	onEditNode?: ((id: number) => void) | undefined;
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
	drag,
	focusedNodeId,
	isStructurePending = false,
	item,
	itemsByParentId,
	level = DEFAULT_LEVEL,
	onCreateDocument,
	onEditNode,
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
	const rowActions =
		onCreateDocument && onMoveDocument && canStructure ? (
			<KnowledgeTreeRowActions
				isPending={isStructurePending}
				item={item}
				items={treeItems}
				onCreateDocument={onCreateDocument}
				onEdit={onEditNode}
				onMoveDocument={onMoveDocument}
				onSelect={onSelect}
			/>
		) : null;
	const isDraggable = Boolean(drag) && Boolean(rowActions) && !isSearching;
	const isDropTarget = drag?.draggedId !== undefined;
	const indicator =
		drag?.indicator?.targetId === item.id ? drag.indicator.zone : undefined;

	const handleDragStart = useCallback(
		(event_: React.DragEvent<HTMLElement>): void => {
			drag?.onDragStart(event_, item.id);
		},
		[drag, item.id],
	);

	const handleDragOver = useCallback(
		(event_: React.DragEvent<HTMLElement>): void => {
			drag?.onDragOver(event_, item.id);
		},
		[drag, item.id],
	);

	const handleDrop = useCallback(
		(event_: React.DragEvent<HTMLElement>): void => {
			drag?.onDrop(event_, item.id);
		},
		[drag, item.id],
	);

	return (
		<div className="flex flex-col gap-0.5" role="none">
			<div
				className="group relative flex items-center gap-0.5"
				onDragOver={isDropTarget ? handleDragOver : undefined}
				onDrop={isDropTarget ? handleDrop : undefined}
				style={{ paddingLeft: paddingLeftString }}
			>
				{isDraggable && (
					<span
						aria-hidden="true"
						className="absolute left-0 top-1/2 flex -translate-y-1/2 cursor-grab items-center text-text-faint opacity-0 group-focus-within:opacity-100 group-hover:opacity-100 active:cursor-grabbing"
						data-testid={`drag-grip-${String(item.id)}`}
						draggable
						onDragEnd={drag?.onDragEnd}
						onDragStart={handleDragStart}
					>
						<Icon name="drag-handle" size={DRAG_GRIP_ICON_SIZE} />
					</span>
				)}
				{indicator === DropZone.BEFORE && (
					<span
						aria-hidden="true"
						className="pointer-events-none absolute inset-x-0 top-0 h-0.5 rounded-full bg-accent"
						data-testid="drop-indicator"
					/>
				)}
				{indicator === DropZone.AFTER && (
					<span
						aria-hidden="true"
						className="pointer-events-none absolute inset-x-0 bottom-0 h-0.5 rounded-full bg-accent"
						data-testid="drop-indicator"
					/>
				)}
				{indicator === DropZone.INSIDE && (
					<span
						aria-hidden="true"
						className="pointer-events-none absolute inset-0 rounded-[7px] ring-2 ring-accent/60"
						data-testid="drop-indicator"
					/>
				)}
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
					<span
						aria-hidden="true"
						className="flex size-3.5 shrink-0 items-center justify-center"
					>
						<Icon
							name={isDocumentNode(item.type) ? "folder" : "file-rounded"}
							size={NODE_ICON_SIZE}
						/>
					</span>
					<HighlightedText highlight={searchQuery} text={item.title} />
				</button>
				{rowActions}
			</div>

			{hasChildren && isExpanded && (
				<div
					className="flex flex-col gap-0.5"
					id={`group-${String(item.id)}`}
					role="group"
				>
					{children.map((child) => (
						<KnowledgeTreeItem
							canStructure={canStructure}
							drag={drag}
							focusedNodeId={focusedNodeId}
							isStructurePending={isStructurePending}
							item={child}
							itemsByParentId={itemsByParentId}
							key={child.id}
							level={level + LEVEL_INCREMENT}
							onCreateDocument={onCreateDocument}
							onEditNode={onEditNode}
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
