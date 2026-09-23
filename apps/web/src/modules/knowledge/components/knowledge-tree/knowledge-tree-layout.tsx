import React, { useCallback, useMemo, useState } from "react";

import { useAppDispatch, useAppSelector, useModal } from "~/hooks/hooks.js";

import { actions } from "../../knowledge.js";
import { EMPTY_LENGTH } from "../../libs/constants/constants.js";
import {
	type KnowledgeEntryResponseDto,
	type KnowledgeTreeItemResponseDto,
} from "../../libs/mock-knowledge-tree.js";
import { AddKnowledgeModal } from "../add-knowledge-modal/add-knowledge-modal.js";
import { IntegrationPreview } from "../integration-preview/integration-preview.js";
import { DEFAULT_PROPOSED_STRUCTURE } from "../integration-preview/libs/constants.js";
import { LoadingState } from "../loading-state/loading-state.js";
import { KnowledgeTreeContent } from "./knowledge-tree-content.js";
import { KnowledgeTreeEmptyState } from "./knowledge-tree-empty-state.js";
import { KnowledgeTreeHeader } from "./knowledge-tree-header.js";
import { KnowledgeTreeSidebar } from "./knowledge-tree-sidebar.js";

const DEFAULT_BASELINE = 1;
const LIVE_VERSION = 2;

type Properties = {
	canEdit?: boolean;
	entries: Record<number, KnowledgeEntryResponseDto>;
	items: KnowledgeTreeItemResponseDto[];
	onSelectPage: (id: number) => void;
	selectedPageId?: number | undefined;
};

const KnowledgeTreeLayout: React.FC<Properties> = ({
	canEdit = false,
	entries,
	items,
	onSelectPage,
	selectedPageId,
}: Properties) => {
	const dispatch = useAppDispatch();
	const { isAddingKnowledge } = useAppSelector((state) => state.knowledge);

	const {
		hideModal: handleCloseAddModal,
		isOpen: isAddModalOpen,
		showModal: handleOpenAddModal,
	} = useModal();

	const [isPreviewOpen, setIsPreviewOpen] = useState<boolean>(false);
	const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(false);

	const isKbEmpty = items.length === EMPTY_LENGTH;

	const handleAddMore = useCallback((): void => {
		setIsPreviewOpen(false);
		handleOpenAddModal();
	}, [handleOpenAddModal]);

	const handleApproveIntegration = useCallback((): void => {
		dispatch(actions.finishAddingKnowledge());
	}, [dispatch]);

	const handleClosePreview = useCallback((): void => {
		setIsPreviewOpen(false);
	}, []);

	const handleCloseSidebar = useCallback((): void => {
		setIsSidebarOpen(false);
	}, []);

	const handleFinishLoading = useCallback((): void => {
		dispatch(actions.finishAddingKnowledge());
		setIsPreviewOpen(true);
	}, [dispatch]);

	const handleOpenPreview = useCallback((): void => {
		setIsPreviewOpen(true);
	}, []);

	const handleOpenSidebar = useCallback((): void => {
		setIsSidebarOpen(true);
	}, []);

	const breadcrumbs = useMemo(() => {
		if (!selectedPageId) {
			return [];
		}
		const path: string[] = [];
		let currentId: null | number = selectedPageId;

		while (currentId !== null) {
			const item = items.find((item) => item.id === currentId);
			if (item) {
				path.unshift(item.title);
				currentId = item.parentId;
			} else {
				currentId = null;
			}
		}

		return path;
	}, [items, selectedPageId]);

	if (isPreviewOpen) {
		return (
			<div className="h-full w-full bg-bg">
				<IntegrationPreview
					baselineVersion={DEFAULT_BASELINE}
					currentLiveVersion={LIVE_VERSION}
					onAddMore={handleAddMore}
					onApprove={handleApproveIntegration}
					onClose={handleClosePreview}
					proposedStructure={DEFAULT_PROPOSED_STRUCTURE}
				/>
				<AddKnowledgeModal
					isOpen={isAddModalOpen}
					onClose={handleCloseAddModal}
				/>
			</div>
		);
	}

	if (isKbEmpty) {
		return (
			<div className="flex h-full w-full items-center justify-center bg-bg">
				{isAddingKnowledge ? (
					<LoadingState onFinish={handleFinishLoading} variant="full" />
				) : (
					<KnowledgeTreeEmptyState />
				)}
				<AddKnowledgeModal
					isOpen={isAddModalOpen}
					onClose={handleCloseAddModal}
				/>
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
				onSelectPage={onSelectPage}
				selectedPageId={selectedPageId}
			/>
			<div className="flex min-w-0 flex-1 flex-col overflow-hidden">
				<KnowledgeTreeHeader
					breadcrumbs={breadcrumbs}
					canEdit={canEdit}
					onOpenSidebar={handleOpenSidebar}
					onPreview={handleOpenPreview}
					showCompactLoading={isAddingKnowledge}
				/>
				{isAddingKnowledge && (
					<div className="border-b border-border bg-surface px-4 py-4 @5xl:hidden">
						<LoadingState onPreview={handleOpenPreview} variant="compact" />
					</div>
				)}
				{selectedEntry ? (
					<KnowledgeTreeContent entry={selectedEntry} />
				) : (
					<div className="flex flex-1 items-center justify-center text-text-muted">
						Select a page to view its content.
					</div>
				)}
			</div>
			<AddKnowledgeModal
				isOpen={isAddModalOpen}
				onClose={handleCloseAddModal}
			/>
		</div>
	);
};

export { KnowledgeTreeLayout };
