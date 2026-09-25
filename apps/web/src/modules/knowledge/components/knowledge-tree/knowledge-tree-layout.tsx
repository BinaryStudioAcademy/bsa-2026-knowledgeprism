import { KnowledgeNodeType } from "@knowledgeprism/constants";
import {
	type KnowledgeEntryResponseDto,
	type KnowledgeTreeItemResponseDto,
} from "@knowledgeprism/types";
import React, { useCallback, useMemo, useState } from "react";
import { useParams } from "react-router-dom";

import { Loader } from "~/components/components.js";
import { useAppDispatch, useAppSelector, useModal } from "~/hooks/hooks.js";

import { actions } from "../../knowledge.js";
import {
	DEFAULT_BASELINE,
	EMPTY_LENGTH,
	LIVE_VERSION,
} from "../../libs/constants/constants.js";
import { type ProposedPage } from "../../libs/types/types.js";
import { AddKnowledgeModal } from "../add-knowledge-modal/add-knowledge-modal.js";
import { IntegrationPreview } from "../integration-preview/integration-preview.js";
import { DEFAULT_PROPOSED_STRUCTURE } from "../integration-preview/libs/constants.js";
import { LoadingState } from "../loading-state/loading-state.js";
import { KnowledgeTreeContent } from "./knowledge-tree-content.js";
import { KnowledgeTreeEmptyState } from "./knowledge-tree-empty-state.js";
import { KnowledgeTreeHeader } from "./knowledge-tree-header.js";
import { KnowledgeTreeSidebar } from "./knowledge-tree-sidebar.js";

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
	const {
		activeDocumentId,
		activeDocumentStatus,
		errorMessage,
		extractionItems,
		isAddingKnowledge,
		isEntryLoading,
		isTreeLoading,
	} = useAppSelector((state) => state.knowledge);
	const { id: projectId } = useParams();
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

	const handleResetState = useCallback((): void => {
		dispatch(actions.resetState());
		dispatch(actions.finishAddingKnowledge());
	}, [dispatch]);

	const handleRetry = useCallback((): void => {
		if (!projectId || !activeDocumentId) {
			return;
		}

		void dispatch(
			actions.retryDocumentProcessing({
				documentId: activeDocumentId,
				projectId,
			}),
		);
	}, [activeDocumentId, dispatch, projectId]);

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

	const mappedProposedStructure = useMemo(() => {
		if (extractionItems.length === EMPTY_LENGTH) {
			return DEFAULT_PROPOSED_STRUCTURE;
		}

		const sectionsMap = new Map<number, ProposedPage[]>();

		for (const item of extractionItems) {
			const pageNumber = item.sourcePageNumber;
			const pages = sectionsMap.get(pageNumber) ?? [];

			pages.push({
				content: item.text,
				id: String(item.id),
				status: "created",
				title: item.title,
				type: KnowledgeNodeType.PAGE,
			});

			sectionsMap.set(pageNumber, pages);
		}

		return [...sectionsMap]
			.toSorted(([pageA], [pageB]) => pageA - pageB)
			.map(([pageNumber, pages]) => ({
				id: `sec-${String(pageNumber)}`,
				pages,
				status: "created" as const,
				title: `Extracted from Page ${String(pageNumber)}`,
				type: KnowledgeNodeType.SECTION,
			}));
	}, [extractionItems]);

	if (isPreviewOpen) {
		return (
			<div className="flex h-full w-full flex-col bg-bg">
				<div className="min-h-0 flex-1">
					<IntegrationPreview
						baselineVersion={DEFAULT_BASELINE}
						currentLiveVersion={LIVE_VERSION}
						onAddMore={handleAddMore}
						onApprove={handleApproveIntegration}
						onClose={handleClosePreview}
						proposedStructure={mappedProposedStructure}
					/>
				</div>
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
			emptyStateContent =
				activeDocumentStatus === "FAILED" ? (
					<LoadingState
						currentStatus={activeDocumentStatus}
						hasError={true}
						onCancel={handleResetState}
						onRetry={handleRetry}
						variant="full"
					/>
				) : (
					<LoadingState
						currentStatus={activeDocumentStatus}
						onFinish={handleFinishLoading}
						variant="full"
					/>
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
					currentStatus={activeDocumentStatus}
					isEditing={isEditing}
					onCancel={handleCancelEdit}
					onEdit={handleStartEdit}
					onOpenSidebar={handleOpenSidebar}
					onPreview={handleOpenPreview}
					onResetState={handleResetState}
					onRetry={handleRetry}
					showCompactLoading={isAddingKnowledge}
				/>
				{isAddingKnowledge && (
					<div className="border-b border-border bg-surface px-4 py-4 @5xl:hidden">
						{activeDocumentStatus === "FAILED" ? (
							<LoadingState
								currentStatus={activeDocumentStatus}
								hasError={true}
								onCancel={handleResetState}
								onRetry={handleRetry}
								variant="compact"
							/>
						) : (
							<LoadingState
								currentStatus={activeDocumentStatus}
								onPreview={handleOpenPreview}
								variant="compact"
							/>
						)}
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
