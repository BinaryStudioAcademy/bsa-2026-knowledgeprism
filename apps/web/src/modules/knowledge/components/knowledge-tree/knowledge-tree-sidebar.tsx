import { type KnowledgeTreeItemResponseDto } from "@knowledgeprism/types";
import { useFocusReturn, useFocusTrap, useMergedRef } from "@mantine/hooks";
import React, {
	useCallback,
	useEffect,
	useMemo,
	useRef,
	useState,
} from "react";
import { tv } from "tailwind-variants";

import {
	EMPTY_LENGTH,
	FALLBACK_DEFER_EXECUTION_MS,
	FOCUS_DELAY_MS,
	MIN_INDEX,
} from "../../libs/constants/constants.js";
import { filterKnowledgeTree } from "../../libs/helpers/helpers.js";
import { KnowledgeTreeItem } from "./knowledge-tree-item.js";
import { KnowledgeTreeSearchBar } from "./knowledge-tree-search-bar.js";

const sidebarDrawerStyles = tv({
	base: "fixed inset-y-0 left-0 z-50 flex h-full w-65 shrink-0 flex-col border-r border-border bg-surface transition-all duration-300 @5xl:static @5xl:translate-x-0 @5xl:visible",
	variants: {
		isOpen: {
			false: "-translate-x-full invisible",
			true: "translate-x-0 visible",
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

	const itemsByParentId = useMemo(() => {
		const map = new Map<null | number, KnowledgeTreeItemResponseDto[]>();
		for (const item of filteredItems) {
			const parentId = item.parentId ?? null;
			const children = map.get(parentId);

			if (children) {
				children.push(item);
			} else {
				map.set(parentId, [item]);
			}
		}
		for (const children of map.values()) {
			children.sort((a, b) => a.position - b.position);
		}
		return map;
	}, [filteredItems]);

	const rootItems = itemsByParentId.get(null) ?? [];

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

	const sidebarReference = useRef<HTMLElement>(null);
	const focusTrapReference = useFocusTrap(isOpen);
	const mergedReference = useMergedRef(sidebarReference, focusTrapReference);

	useFocusReturn({ opened: isOpen });

	useEffect(() => {
		if (!isOpen) {
			return;
		}

		const timeoutId = setTimeout(() => {
			if (sidebarReference.current) {
				sidebarReference.current.focus();
			}
		}, FOCUS_DELAY_MS);

		const handleGlobalKeyDown = (event: KeyboardEvent) => {
			if (event.key === "Escape") {
				onClose();
			}
		};
		document.addEventListener("keydown", handleGlobalKeyDown);
		return () => {
			clearTimeout(timeoutId);
			document.removeEventListener("keydown", handleGlobalKeyDown);
		};
	}, [isOpen, onClose]);

	return (
		<>
			{isOpen && (
				<div
					aria-label="Close sidebar"
					className="fixed inset-0 z-40 bg-primary/30 @5xl:hidden"
					onClick={onClose}
					onKeyDown={handleBackdropKeyDown}
					role="button"
					tabIndex={-1}
				/>
			)}

			<aside
				className={sidebarDrawerStyles({ isOpen })}
				ref={mergedReference}
				tabIndex={-1}
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
								itemsByParentId={itemsByParentId}
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
			</aside>
		</>
	);
};

export { KnowledgeTreeSidebar };
