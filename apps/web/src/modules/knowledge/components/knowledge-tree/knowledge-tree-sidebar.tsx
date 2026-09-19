import React, { useCallback, useMemo, useState } from "react";

import { filterKnowledgeTree } from "../../libs/helpers/helpers.js";
import { type KnowledgeTreeItemResponseDto } from "../../libs/mock-knowledge-tree.js";
import { KnowledgeTreeItem } from "./knowledge-tree-item.js";
import { KnowledgeTreeSearchBar } from "./knowledge-tree-search-bar.js";

type Properties = {
	isOpen: boolean;
	items: KnowledgeTreeItemResponseDto[];
	onClose: () => void;
	onSelectPage: (id: number) => void;
	selectedPageId?: number | undefined;
};

const EMPTY_LENGTH = 0;

const KnowledgeTreeSidebar: React.FC<Properties> = ({
	isOpen,
	items,
	onClose,
	onSelectPage,
	selectedPageId,
}: Properties) => {
	const [searchQuery, setSearchQuery] = useState("");

	const filteredItems = useMemo(
		() => filterKnowledgeTree(items, searchQuery),
		[items, searchQuery],
	);

	const rootItems = filteredItems
		.filter((item) => item.parentId === null)
		.toSorted((a, b) => a.position - b.position);

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
			if (event_.key === "Enter" || event_.key === " ") {
				onClose();
			}
		},
		[onClose],
	);

	return (
		<>
			{/* Mobile Backdrop */}
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

			<div
				className={`fixed inset-y-0 left-0 z-50 flex h-full w-65 shrink-0 flex-col border-r border-border bg-surface transition-transform duration-300 @5xl:static @5xl:translate-x-0 ${
					isOpen ? "translate-x-0" : "-translate-x-full"
				}`}
			>
				<div className="flex items-center justify-between px-4.5 pb-3 pt-4.5">
					<span className="text-control font-medium text-text">
						Knowledge Tree
					</span>
				</div>

				<KnowledgeTreeSearchBar
					onChange={handleSearchChange}
					value={searchQuery}
				/>

				<div className="flex flex-1 min-h-0 flex-col gap-0.5 overflow-y-auto px-3 pb-4">
					{rootItems.length > EMPTY_LENGTH ? (
						rootItems.map((item) => (
							<KnowledgeTreeItem
								item={item}
								items={filteredItems}
								key={item.id}
								onSelect={handleSelectPage}
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
