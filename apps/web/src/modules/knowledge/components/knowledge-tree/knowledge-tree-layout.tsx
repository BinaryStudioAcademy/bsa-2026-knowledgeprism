import React, { useCallback, useMemo, useState } from "react";

import {
	type KnowledgeEntryResponseDto,
	type KnowledgeTreeItemResponseDto,
} from "../../libs/mock-knowledge-tree.js";
import { KnowledgeTreeContent } from "./knowledge-tree-content.js";
import { KnowledgeTreeEmptyState } from "./knowledge-tree-empty-state.js";
import { KnowledgeTreeHeader } from "./knowledge-tree-header.js";
import { KnowledgeTreeSidebar } from "./knowledge-tree-sidebar.js";

type Properties = {
	canEdit?: boolean;
	entries: Record<number, KnowledgeEntryResponseDto>;
	items: KnowledgeTreeItemResponseDto[];
};

const KnowledgeTreeLayout: React.FC<Properties> = ({
	canEdit = false,
	entries,
	items,
}: Properties) => {
	const [selectedPageId, setSelectedPageId] = useState<number | undefined>(
		items.find((item) => item.type === "PAGE" || item.type === "ENTRY")?.id,
	);
	const [isSidebarOpen, setIsSidebarOpen] = useState(false);

	const breadcrumbs = useMemo(() => {
		if (!selectedPageId) {
			return [];
		}
		const path: string[] = [];
		let currentId: null | number = selectedPageId;

		while (currentId !== null) {
			const item = items.find((index) => index.id === currentId);
			if (item) {
				path.unshift(item.title);
				currentId = item.parentId;
			} else {
				currentId = null;
			}
		}

		return path;
	}, [items, selectedPageId]);

	const handleOpenSidebar = useCallback(() => {
		setIsSidebarOpen(true);
	}, []);

	const handleCloseSidebar = useCallback(() => {
		setIsSidebarOpen(false);
	}, []);

	const EMPTY_LENGTH = 0;

	if (items.length === EMPTY_LENGTH) {
		return (
			<div className="flex h-full w-full bg-bg">
				<KnowledgeTreeEmptyState />
			</div>
		);
	}

	const selectedEntry = selectedPageId ? entries[selectedPageId] : undefined;

	return (
		<div className="@container flex h-full w-full bg-bg">
			<KnowledgeTreeSidebar
				isOpen={isSidebarOpen}
				items={items}
				onClose={handleCloseSidebar}
				onSelectPage={setSelectedPageId}
				selectedPageId={selectedPageId}
			/>
			<div className="flex min-w-0 flex-1 flex-col overflow-hidden">
				<KnowledgeTreeHeader
					breadcrumbs={breadcrumbs}
					canEdit={canEdit}
					onOpenSidebar={handleOpenSidebar}
				/>
				{selectedEntry ? (
					<KnowledgeTreeContent entry={selectedEntry} />
				) : (
					<div className="flex flex-1 items-center justify-center text-text-muted">
						Select a page to view its content.
					</div>
				)}
			</div>
		</div>
	);
};

export { KnowledgeTreeLayout };
