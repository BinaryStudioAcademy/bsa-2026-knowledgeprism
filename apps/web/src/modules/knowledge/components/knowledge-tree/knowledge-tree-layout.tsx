import { DocumentStatus, KnowledgeNodeType } from "@knowledgeprism/constants";
import {
	type KnowledgeEntryResponseDto,
	type KnowledgeTreeItemResponseDto,
} from "@knowledgeprism/types";
import React, { useCallback, useEffect, useMemo, useState } from "react";

import { Loader } from "~/components/components.js";
import {
	useAppDispatch,
	useAppSelector,
	useCurrentProjectId,
	useModal,
} from "~/hooks/hooks.js";

import { actions } from "../../knowledge.js";
import { EMPTY_LENGTH } from "../../libs/constants/constants.js";
import {
	type ProposedPage,
	type ProposedSection,
} from "../../libs/types/types.js";
import { AddKnowledgeModal } from "../add-knowledge-modal/add-knowledge-modal.js";
import { IntegrationPreview } from "../integration-preview/integration-preview.js";
import { LoadingState } from "../loading-state/loading-state.js";
import { IntegrationPreviewPanel } from "./integration-preview-panel.js";
import { KnowledgeTreeContent } from "./knowledge-tree-content.js";
import { KnowledgeTreeEmptyState } from "./knowledge-tree-empty-state.js";
import { KnowledgeTreeHeader } from "./knowledge-tree-header.js";
import { KnowledgeTreeSidebar } from "./knowledge-tree-sidebar.js";

type PreviewLayerProperties = {
	activeDocumentId: null | number;
	extractionStructure: ProposedSection[];
	isAddModalOpen: boolean;
	isExtractionValidationPreview: boolean;
	onAddMore: () => void;
	onApproveIntegration: () => void;
	onCloseAddModal: () => void;
	onClosePreview: () => void;
	onExtractionValidationApprove: () => Promise<boolean>;
	projectId: null | string;
};

type Properties = {
	canEdit?: boolean;
	entries: Record<number, KnowledgeEntryResponseDto>;
	isTreeReady?: boolean;
	items: KnowledgeTreeItemResponseDto[];
	onSelectPage: (id: number) => void;
	selectedPageId?: number | undefined;
};

const KnowledgeTreePreviewLayer: React.FC<PreviewLayerProperties> = ({
	activeDocumentId,
	extractionStructure,
	isAddModalOpen,
	isExtractionValidationPreview,
	onAddMore,
	onApproveIntegration,
	onCloseAddModal,
	onClosePreview,
	onExtractionValidationApprove,
	projectId,
}: PreviewLayerProperties) => {
	const previewContent = isExtractionValidationPreview ? (
		<div className="h-full w-full bg-bg">
			<IntegrationPreview
				onAddMore={onAddMore}
				onApprove={onExtractionValidationApprove}
				onClose={onClosePreview}
				proposedStructure={extractionStructure}
			/>
		</div>
	) : (
		<IntegrationPreviewPanel
			documentId={activeDocumentId ?? undefined}
			onAddMore={onAddMore}
			onApprove={onApproveIntegration}
			onClose={onClosePreview}
			projectId={projectId}
		/>
	);

	return (
		<>
			{previewContent}
			<AddKnowledgeModal isOpen={isAddModalOpen} onClose={onCloseAddModal} />
		</>
	);
};

const KnowledgeTreeLayout: React.FC<Properties> = ({
	canEdit = false,
	entries,
	isTreeReady = true,
	items,
	onSelectPage,
	selectedPageId,
}: Properties) => {
	const projectId = useCurrentProjectId();
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
	const [isEditing, setIsEditing] = useState<boolean>(false);

	const {
		hideModal: handleCloseAddModal,
		isOpen: isAddModalOpen,
		showModal: handleOpenAddModal,
	} = useModal();

	const [isPreviewOpen, setIsPreviewOpen] = useState<boolean>(false);
	const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(false);

	const isKbEmpty = items.length === EMPTY_LENGTH;
	const isExtractionValidationPreview =
		activeDocumentStatus === DocumentStatus.WAITING_FOR_VALIDATION;

	useEffect(() => {
		dispatch(actions.resetState());
	}, [dispatch, projectId]);

	const handleAddMore = useCallback((): void => {
		setIsPreviewOpen(false);
		dispatch(actions.clearIntegrationPreview());
		handleOpenAddModal();
	}, [dispatch, handleOpenAddModal]);

	const handleApproveIntegration = useCallback((): void => {
		dispatch(actions.finishAddingKnowledge());
		void dispatch(actions.fetchKnowledgeTree({ projectId }));
	}, [dispatch, projectId]);

	const handleClosePreview = useCallback((): void => {
		setIsPreviewOpen(false);
		dispatch(actions.clearIntegrationPreview());
	}, [dispatch]);

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

		if (activeDocumentStatus === DocumentStatus.FAILED) {
			void (async () => {
				try {
					await dispatch(
						actions.retryDocumentProcessing({
							documentId: activeDocumentId,
							projectId,
						}),
					).unwrap();

					void dispatch(
						actions.pollDocumentStatus({
							documentId: activeDocumentId,
							projectId,
						}),
					);
				} catch {
					// Redux handles the error state
				}
			})();
		} else if (activeDocumentStatus === DocumentStatus.WAITING_FOR_VALIDATION) {
			void dispatch(
				actions.fetchExtractionItems({
					documentId: activeDocumentId,
					projectId,
				}),
			);
		} else {
			void dispatch(
				actions.pollDocumentStatus({
					documentId: activeDocumentId,
					projectId,
				}),
			);
		}
	}, [activeDocumentId, activeDocumentStatus, dispatch, projectId]);

	const mappedExtractionStructure = useMemo((): ProposedSection[] => {
		if (extractionItems.length === EMPTY_LENGTH) {
			return [];
		}

		const sectionsMap = new Map<number, ProposedPage[]>();

		for (const item of extractionItems) {
			const pageNumber = item.sourcePageNumber;
			const pages = sectionsMap.get(pageNumber) ?? [];

			pages.push({
				content: item.text,
				id: String(item.id),
				integrationChangeId: item.id,
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

	const submitExtractionValidation = useCallback(async (): Promise<boolean> => {
		if (!activeDocumentId || !projectId) {
			return false;
		}

		const approvedIds = extractionItems.map((item) => item.id);

		try {
			const response = await dispatch(
				actions.submitExtractionReview({
					documentId: activeDocumentId,
					payload: { approvedIds, rejectedIds: [] },
					projectId,
				}),
			).unwrap();

			if (response.status === DocumentStatus.INTEGRATING) {
				setIsPreviewOpen(false);
				dispatch(actions.startAddingKnowledge());
				void dispatch(
					actions.pollDocumentStatus({
						documentId: activeDocumentId,
						projectId,
					}),
				);
			} else if (response.status === DocumentStatus.COMPLETED) {
				setIsPreviewOpen(false);
				dispatch(actions.finishAddingKnowledge());
				void dispatch(actions.fetchKnowledgeTree({ projectId }));
			}

			return true;
		} catch {
			return false;
		}
	}, [activeDocumentId, dispatch, extractionItems, projectId]);

	const handleExtractionValidationApprove =
		useCallback(async (): Promise<boolean> => {
			return await submitExtractionValidation();
		}, [submitExtractionValidation]);

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
			<KnowledgeTreePreviewLayer
				activeDocumentId={activeDocumentId}
				extractionStructure={mappedExtractionStructure}
				isAddModalOpen={isAddModalOpen}
				isExtractionValidationPreview={isExtractionValidationPreview}
				onAddMore={handleAddMore}
				onApproveIntegration={handleApproveIntegration}
				onCloseAddModal={handleCloseAddModal}
				onClosePreview={handleClosePreview}
				onExtractionValidationApprove={handleExtractionValidationApprove}
				projectId={projectId}
			/>
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
				activeDocumentStatus === DocumentStatus.FAILED ? (
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
					hasError={!!errorMessage}
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
						{!!errorMessage ||
						activeDocumentStatus === DocumentStatus.FAILED ? (
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
