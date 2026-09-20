import React, { useCallback, useEffect, useMemo, useState } from "react";
import { tv } from "tailwind-variants";

import { filterKnowledgeTree } from "../../libs/helpers/helpers.js";
import { type KnowledgeTreeItemResponseDto } from "../../libs/mock-knowledge-tree.js";
import {
	EMPTY_LENGTH,
	FALLBACK_DEFER_EXECUTION_MS,
	MIN_INDEX,
} from "./constants.js";
import { KnowledgeTreeItem } from "./knowledge-tree-item.js";
import { KnowledgeTreeSearchBar } from "./knowledge-tree-search-bar.js";

const sidebarDrawerStyles = tv({
	base: "fixed inset-y-0 left-0 z-50 flex h-full w-65 shrink-0 flex-col border-r border-border bg-surface transition-transform duration-300 @5xl:static @5xl:translate-x-0",
	variants: {
		isOpen: {
			false: "-translate-x-full",
			true: "translate-x-0",
		},
	},
});

type Properties = {
	isOpen: boolean;
	items: KnowledgeTreeItemResponseDto[];
	onClose: () => void;
	onSelectPage: (id: number) => void;
	selectedPageId?: number | undefined;
};

const KnowledgeTreeSidebar: React.FC<Properties> = ({
	isOpen,
	items,
	onClose,
	onSelectPage,
	selectedPageId,
}: Properties) => {
	const [searchQuery, setSearchQuery] = useState("");
	const [focusedNodeId, setFocusedNodeId] = useState<number | undefined>();

	const filteredItems = useMemo(
		() => filterKnowledgeTree(items, searchQuery),
		[items, searchQuery],
	);

	const rootItems = filteredItems
		.filter((item) => item.parentId === null)
		.toSorted((a, b) => a.position - b.position);

	const isFocusedNodeVisible = filteredItems.some(
		(item) => item.id === (focusedNodeId ?? selectedPageId),
	);

	const currentFocusId = isFocusedNodeVisible
		? (focusedNodeId ?? selectedPageId)
		: rootItems[MIN_INDEX]?.id;

	useEffect(() => {
		if (currentFocusId === undefined) {
			return;
		}

		const expectedFocusElement = document.querySelector(
			`#knowledge-tree-root [data-id="${CSS.escape(String(currentFocusId))}"]`,
		);

		if (!expectedFocusElement) {
			const firstVisibleItem = document.querySelector(
				"#knowledge-tree-root [role='treeitem']",
			);
			if (firstVisibleItem) {
				const fallbackId = Number(
					(firstVisibleItem as HTMLElement).dataset["id"],
				);
				setTimeout(() => {
					setFocusedNodeId(fallbackId);
				}, FALLBACK_DEFER_EXECUTION_MS);
			}
		}
	}, [currentFocusId, searchQuery]);

	const handleSearchChange = useCallback(
		(event_: React.ChangeEvent<HTMLInputElement>) => {
			setSearchQuery(event_.target.value);
		},
		[],
	);

	const handleSelectPage = useCallback(
		(id: number) => {
			onSelectPage(id);
			onClose();
		},
		[onClose, onSelectPage],
	);

	const handleBackdropKeyDown = useCallback(
		(event_: React.KeyboardEvent<HTMLDivElement>) => {
			if (event_.key !== "Enter" && event_.key !== " ") {
				return;
			}

			onClose();
			event_.preventDefault();
		},
		[onClose],
	);

	return (
		<>
			{isOpen && (
				<div
					aria-label="Close sidebar"
					className="fixed inset-0 z-40 bg-primary/30 @5xl:hidden"
					onClick={onClose}
					onKeyDown={handleBackdropKeyDown}
					role="button"
					tabIndex={0}
				/>
			)}

			<div className={sidebarDrawerStyles({ isOpen })}>
				<div className="flex items-center justify-between px-4.5 pb-3 pt-4.5">
					<span className="text-control font-medium text-text">
						Knowledge Tree
					</span>
				</div>

				<KnowledgeTreeSearchBar
					onChange={handleSearchChange}
					value={searchQuery}
				/>

				<div
					aria-label="Knowledge Tree"
					className="flex flex-1 min-h-0 flex-col gap-0.5 overflow-y-auto px-3 pb-4"
					id="knowledge-tree-root"
					role="tree"
				>
					{rootItems.length > EMPTY_LENGTH ? (
						rootItems.map((item) => (
							<KnowledgeTreeItem
								focusedNodeId={currentFocusId}
								item={item}
								items={filteredItems}
								key={item.id}
								onFocus={setFocusedNodeId}
								onSelect={handleSelectPage}
								searchQuery={searchQuery}
								selectedId={selectedPageId}
							/>
						))
					) : (
						<div className="px-2.5 py-4 text-center text-sm text-text-faint">
							No results found
						</div>
					)}
				</div>
			</div>
		</>
	);
};

export { KnowledgeTreeSidebar };
