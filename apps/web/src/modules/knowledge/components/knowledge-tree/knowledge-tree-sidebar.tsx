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
	useAppDispatch,
	useAppSelector,
	useCurrentProjectId,
} from "~/hooks/hooks.js";
import { useDebouncedValue } from "~/hooks/use-debounced-value/use-debounced-value.hook.js";

import { actions } from "../../knowledge.js";
import {
	EMPTY_LENGTH,
	FALLBACK_DEFER_EXECUTION_MS,
	FOCUS_DELAY_MS,
	MIN_INDEX,
	SEARCH_DEBOUNCE_MS,
} from "../../libs/constants/constants.js";
import {
	type DocumentPlacement,
	filterKnowledgeTree,
	getTreeItemElement,
} from "../../libs/helpers/helpers.js";
import { KnowledgeTreeDocumentForm } from "./knowledge-tree-document-form.js";
import { useKnowledgeTreeDrag } from "./knowledge-tree-drag.js";
import { KnowledgeTreeItem } from "./knowledge-tree-item.js";
import { KnowledgeTreeSearchBar } from "./knowledge-tree-search-bar.js";

const sidebarDrawerStyles = tv({
	base: "fixed inset-y-0 left-0 z-50 flex h-full w-65 shrink-0 flex-col border-r border-border bg-surface transition-all duration-300 @5xl:static @5xl:translate-x-0 @5xl:visible",
	variants: {
		isCollapsed: {
			false: "",
			true: "@5xl:hidden",
		},
		isOpen: {
			false: "-translate-x-full invisible",
			true: "translate-x-0 visible",
		},
	},
});

type Properties = {
	canStructure?: boolean | undefined;
	isCollapsed?: boolean | undefined;
	isOpen: boolean;
	isStructurePending?: boolean | undefined;
	items: KnowledgeTreeItemResponseDto[];
	onClose: () => void;
	onCreateDocument?:
		((title: string, parentId: null | number) => void) | undefined;
	onEditNode?: ((id: number) => void) | undefined;

	onMoveDocument?:
		((id: number, placement: DocumentPlacement) => void) | undefined;
	onSelectPage: (id: number) => void;
	selectedPageId?: number | undefined;
};

const KnowledgeTreeSidebar: React.FC<Properties> = ({
	canStructure = false,
	isCollapsed = false,
	isOpen,
	isStructurePending = false,
	items,
	onClose,
	onCreateDocument,
	onEditNode,
	onMoveDocument,
	onSelectPage,
	selectedPageId,
}: Properties) => {
	const [searchQuery, setSearchQuery] = useState("");
	const [focusedNodeId, setFocusedNodeId] = useState<number | undefined>();

	const dispatch = useAppDispatch();
	const projectId = useCurrentProjectId();
	const { isSearchingContent, matchedContentEntryIds } = useAppSelector(
		(state) => state.knowledge,
	);
	const debouncedSearchQuery = useDebouncedValue(
		searchQuery,
		SEARCH_DEBOUNCE_MS,
	).trim();

	useEffect(() => {
		if (!debouncedSearchQuery) {
			dispatch(actions.clearContentSearch());
			return;
		}

		void dispatch(
			actions.searchKnowledgeEntries({
				projectId,
				query: debouncedSearchQuery,
			}),
		);
	}, [debouncedSearchQuery, dispatch, projectId]);

	const filteredItems = useMemo(
		() => filterKnowledgeTree(items, searchQuery, matchedContentEntryIds),
		[items, searchQuery, matchedContentEntryIds],
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

	const drag = useKnowledgeTreeDrag(items, onMoveDocument);

	const rootItems = itemsByParentId.get(null) ?? [];

	const isFocusedNodeVisible = filteredItems.some(
		(item) => item.id === (focusedNodeId ?? selectedPageId),
	);

	const currentFocusId = isFocusedNodeVisible
		? (focusedNodeId ?? selectedPageId)
		: rootItems[MIN_INDEX]?.id;

	useEffect(() => {
		if (selectedPageId === undefined) {
			return;
		}

		const selectedElement = getTreeItemElement(selectedPageId);

		if (selectedElement) {
			selectedElement.scrollIntoView({
				behavior: "smooth",
				block: "center",
			});
		}
	}, [selectedPageId]);

	useEffect(() => {
		if (currentFocusId === undefined) {
			return;
		}

		const expectedFocusElement = getTreeItemElement(currentFocusId);

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

	const handleSearchClear = useCallback(() => {
		setSearchQuery("");
	}, []);

	const handleCreateRootDocument = useCallback(
		(title: string): void => {
			if (onCreateDocument) {
				onCreateDocument(title, null);
			}
		},
		[onCreateDocument],
	);

	const handleCreateDocument = useCallback(
		(title: string, parentId: number): void => {
			if (onCreateDocument) {
				onCreateDocument(title, parentId);
			}
		},
		[onCreateDocument],
	);

	const handleSelectPage = useCallback(
		(id: number) => {
			onSelectPage(id);
			onClose();
		},
		[onClose, onSelectPage],
	);

	const handleEditNode = useCallback(
		(id: number) => {
			onEditNode?.(id);
			onClose();
		},
		[onClose, onEditNode],
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
				className={sidebarDrawerStyles({ isCollapsed, isOpen })}
				ref={mergedReference}
				tabIndex={-1}
			>
				<div className="flex min-h-0 flex-1 flex-col">
					<KnowledgeTreeSearchBar
						isSearchingContent={isSearchingContent}
						onChange={handleSearchChange}
						onClear={handleSearchClear}
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
									canStructure={canStructure}
									drag={drag}
									focusedNodeId={currentFocusId}
									isStructurePending={isStructurePending}
									item={item}
									itemsByParentId={itemsByParentId}
									key={item.id}
									onCreateDocument={handleCreateDocument}
									onEditNode={onEditNode ? handleEditNode : undefined}
									onFocus={setFocusedNodeId}
									onMoveDocument={onMoveDocument}
									onSelect={handleSelectPage}
									searchQuery={searchQuery}
									selectedId={selectedPageId}
									treeItems={items}
								/>
							))
						) : (
							<div className="px-2.5 py-4 text-center text-sm text-text-faint">
								{searchQuery.trim() === ""
									? "No documents yet"
									: "No results found"}
							</div>
						)}
					</div>

					{canStructure && onCreateDocument && (
						<div className="shrink-0 px-3 pb-4 pt-3 border-t border-border bg-surface">
							<KnowledgeTreeDocumentForm
								isPending={isStructurePending}
								onSubmit={handleCreateRootDocument}
								submitLabel="Create document"
							/>
						</div>
					)}
				</div>
			</aside>
		</>
	);
};

export { KnowledgeTreeSidebar };
