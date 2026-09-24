import {
	type KnowledgeEntryResponseDto,
	type KnowledgeTreeItemResponseDto,
} from "@knowledgeprism/types";
import React, { useCallback, useMemo, useState } from "react";

import { Loader } from "~/components/components.js";
import { useAppDispatch, useAppSelector, useModal } from "~/hooks/hooks.js";

import { actions } from "../../knowledge.js";
import { EMPTY_LENGTH } from "../../libs/constants/constants.js";
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
	isTreeReady?: boolean;
	items: KnowledgeTreeItemResponseDto[];
	onSelectPage: (id: number) => void;
	selectedPageId?: number | undefined;
};

const KnowledgeTreeLayout: React.FC<Properties> = ({
	canEdit = false,
	entries,
	isTreeReady = true,
	items,
	onSelectPage,
	selectedPageId,
}: Properties) => {
	const dispatch = useAppDispatch();
	const { errorMessage, isAddingKnowledge, isEntryLoading, isTreeLoading } =
		useAppSelector((state) => state.knowledge);
	const [isEditing, setIsEditing] = useState<boolean>(false);

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

	const handleCancelEdit = useCallback((): void => {
		setIsEditing(false);
	}, []);

	const handleStartEdit = useCallback((): void => {
		setIsEditing(true);
	}, []);

	const handleSelectPage = useCallback(
		(id: number): void => {
			setIsEditing(false);
			onSelectPage(id);
		},
		[onSelectPage],
	);

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

	if (isTreeLoading || !isTreeReady) {
		return (
			<div className="flex h-full w-full items-center justify-center bg-bg">
				<Loader size="lg" />
			</div>
		);
	}

	if (isKbEmpty) {
		let emptyStateContent = <KnowledgeTreeEmptyState />;

		if (isAddingKnowledge) {
			emptyStateContent = (
				<LoadingState onFinish={handleFinishLoading} variant="full" />
			);
		} else if (errorMessage) {
			emptyStateContent = (
				<div className="flex flex-col items-center gap-4 text-text-muted">
					<p>{errorMessage}</p>
				</div>
			);
		}

		return (
			<div className="flex h-full w-full items-center justify-center bg-bg">
				{emptyStateContent}
				<AddKnowledgeModal
					isOpen={isAddModalOpen}
					onClose={handleCloseAddModal}
				/>
			</div>
		);
	}

	const selectedEntry = selectedPageId ? entries[selectedPageId] : undefined;

	let mainContent = (
		<div className="flex flex-1 items-center justify-center text-text-muted">
			{errorMessage ?? "Select a page to view its content."}
		</div>
	);

	if (isEntryLoading || (selectedPageId && !selectedEntry && !errorMessage)) {
		mainContent = (
			<div className="flex flex-1 items-center justify-center">
				<Loader />
			</div>
		);
	} else if (selectedEntry) {
		mainContent = (
			<KnowledgeTreeContent
				entry={selectedEntry}
				isEditing={isEditing}
				onCancel={handleCancelEdit}
			/>
		);
	}

	return (
		<div className="@container flex h-full w-full bg-bg">
			<KnowledgeTreeSidebar
				isOpen={isSidebarOpen}
				items={items}
				onClose={handleCloseSidebar}
				onSelectPage={handleSelectPage}
				selectedPageId={selectedPageId}
			/>
			<div className="flex min-w-0 flex-1 flex-col overflow-hidden">
				<KnowledgeTreeHeader
					breadcrumbs={breadcrumbs}
					canEdit={canEdit}
					isEditing={isEditing}
					onCancel={handleCancelEdit}
					onEdit={handleStartEdit}
					onOpenSidebar={handleOpenSidebar}
					onPreview={handleOpenPreview}
					showCompactLoading={isAddingKnowledge}
				/>
				{isAddingKnowledge && (
					<div className="border-b border-border bg-surface px-4 py-4 @5xl:hidden">
						<LoadingState onPreview={handleOpenPreview} variant="compact" />
					</div>
				)}
				{mainContent}
			</div>
			<AddKnowledgeModal
				isOpen={isAddModalOpen}
				onClose={handleCloseAddModal}
			/>
		</div>
	);
};

export { KnowledgeTreeLayout };
