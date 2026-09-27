import { DocumentStatus, KnowledgeNodeType } from "@knowledgeprism/constants";
import {
	type KnowledgeEntryResponseDto,
	type KnowledgeTreeItemResponseDto,
} from "@knowledgeprism/types";
import React, {
	type MouseEvent,
	useCallback,
	useEffect,
	useMemo,
	useState,
} from "react";

import { Loader } from "~/components/components.js";
import {
	useAppDispatch,
	useAppSelector,
	useCurrentProjectId,
	useModal,
} from "~/hooks/hooks.js";
import { type ValueOf } from "~/lib/types/types.js";

import { actions } from "../../knowledge.js";
import { EMPTY_LENGTH } from "../../libs/constants/constants.js";
import {
	collectExtractionItemPatches,
	deriveExtractionReviewIds,
} from "../../libs/helpers/helpers.js";
import { writeTrackedDocumentIds } from "../../libs/helpers/tracked-documents-session.helper.js";
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
	onExtractionValidationApprove: (pages: ProposedSection[]) => Promise<boolean>;
	onSwitchDocument: (documentId: number) => void;
	pendingReviewDocuments: { documentId: number; label: string }[];
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

const SINGLE_TRACKED_DOCUMENT = 1;

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
	onSwitchDocument,
	pendingReviewDocuments,
	projectId,
}: PreviewLayerProperties) => {
	const handlePendingReviewClick = useCallback(
		(event: MouseEvent<HTMLButtonElement>): void => {
			const documentId = Number(event.currentTarget.dataset["documentId"]);

			if (Number.isFinite(documentId)) {
				onSwitchDocument(documentId);
			}
		},
		[onSwitchDocument],
	);

	const previewContent = isExtractionValidationPreview ? (
		<div className="flex h-full w-full flex-col bg-bg">
			{pendingReviewDocuments.length > EMPTY_LENGTH && (
				<div className="flex flex-wrap items-center gap-2 border-b border-border bg-surface px-4 py-2 text-sm">
					<span className="text-text-muted">Also waiting for review:</span>
					{pendingReviewDocuments.map((document) => (
						<button
							className="rounded-md border border-border px-2 py-1 text-text hover:bg-secondary"
							data-document-id={document.documentId}
							key={document.documentId}
							onClick={handlePendingReviewClick}
							type="button"
						>
							{document.label}
						</button>
					))}
				</div>
			)}
			<div className="min-h-0 flex-1">
				<IntegrationPreview
					key={`extraction-${String(activeDocumentId)}-${String(extractionStructure.length)}`}
					onAddMore={onAddMore}
					onApproveExtraction={onExtractionValidationApprove}
					onClose={onClosePreview}
					proposedStructure={extractionStructure}
					variant="extraction-validation"
				/>
			</div>
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
		trackedDocuments,
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
		if (!projectId) {
			return;
		}

		dispatch(actions.resetState());
		void dispatch(actions.initializeProjectKnowledgePipeline({ projectId }));

		return () => {
			dispatch(actions.cancelDocumentPolling());
		};
	}, [dispatch, projectId]);

	const pipelineDocumentStatuses = useMemo((): ValueOf<
		typeof DocumentStatus
	>[] => {
		return [
			DocumentStatus.UPLOADED,
			DocumentStatus.PROCESSING,
			DocumentStatus.PARSED,
			DocumentStatus.EXTRACTING,
			DocumentStatus.EXTRACTED,
			DocumentStatus.WAITING_FOR_VALIDATION,
			DocumentStatus.INTEGRATING,
			DocumentStatus.WAITING_FOR_APPROVAL,
			DocumentStatus.FAILED,
		];
	}, []);

	const hasActiveDocumentPipeline = useMemo(() => {
		return trackedDocuments.some((document) =>
			pipelineDocumentStatuses.includes(
				document.status as ValueOf<typeof DocumentStatus>,
			),
		);
	}, [pipelineDocumentStatuses, trackedDocuments]);

	const isShowDocumentPipelineUi =
		isAddingKnowledge || hasActiveDocumentPipeline;

	const pendingReviewDocuments = useMemo(() => {
		return trackedDocuments.filter(
			(document) =>
				document.documentId !== activeDocumentId &&
				document.status === DocumentStatus.WAITING_FOR_VALIDATION,
		);
	}, [activeDocumentId, trackedDocuments]);

	const canResumePreview = useMemo(() => {
		if (!activeDocumentId) {
			return false;
		}

		return (
			activeDocumentStatus === DocumentStatus.WAITING_FOR_VALIDATION ||
			activeDocumentStatus === DocumentStatus.WAITING_FOR_APPROVAL
		);
	}, [activeDocumentId, activeDocumentStatus]);

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
		if (
			projectId &&
			activeDocumentId &&
			activeDocumentStatus === DocumentStatus.WAITING_FOR_VALIDATION
		) {
			void dispatch(
				actions.fetchExtractionItems({
					documentId: activeDocumentId,
					projectId,
				}),
			);
		}

		setIsPreviewOpen(true);
	}, [activeDocumentId, activeDocumentStatus, dispatch, projectId]);

	const handleOpenSidebar = useCallback((): void => {
		setIsSidebarOpen(true);
	}, []);

	const handleResetState = useCallback((): void => {
		if (projectId) {
			writeTrackedDocumentIds(projectId, []);
		}

		dispatch(actions.resetState());
		dispatch(actions.finishAddingKnowledge());
	}, [dispatch, projectId]);

	const handleSwitchDocument = useCallback(
		(documentId: number): void => {
			if (!projectId) {
				return;
			}

			void (async () => {
				await dispatch(
					actions.switchActiveDocument({ documentId, projectId }),
				).unwrap();
				setIsPreviewOpen(true);
			})();
		},
		[dispatch, projectId],
	);

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

	const submitExtractionValidation = useCallback(
		async (pages: ProposedSection[]): Promise<boolean> => {
			if (!activeDocumentId || !projectId) {
				return false;
			}

			const patches = collectExtractionItemPatches(pages, extractionItems);
			const { approvedIds, rejectedIds } = deriveExtractionReviewIds(
				pages,
				extractionItems,
			);

			if (
				approvedIds.length === EMPTY_LENGTH &&
				rejectedIds.length === EMPTY_LENGTH
			) {
				return false;
			}

			try {
				for (const patch of patches) {
					await dispatch(
						actions.updateExtractionItem({
							documentId: activeDocumentId,
							extractionItemId: patch.id,
							payload: { text: patch.text, title: patch.title },
							projectId,
						}),
					).unwrap();
				}

				const response = await dispatch(
					actions.submitExtractionReview({
						documentId: activeDocumentId,
						payload: { approvedIds, rejectedIds },
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

					if (trackedDocuments.length <= SINGLE_TRACKED_DOCUMENT) {
						dispatch(actions.finishAddingKnowledge());
					}

					void dispatch(actions.fetchKnowledgeTree({ projectId }));
				}

				return true;
			} catch {
				return false;
			}
		},
		[
			activeDocumentId,
			dispatch,
			extractionItems,
			projectId,
			trackedDocuments.length,
		],
	);

	const handleExtractionValidationApprove = useCallback(
		async (pages: ProposedSection[]): Promise<boolean> => {
			return await submitExtractionValidation(pages);
		},
		[submitExtractionValidation],
	);

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
				onSwitchDocument={handleSwitchDocument}
				pendingReviewDocuments={pendingReviewDocuments}
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

		if (isShowDocumentPipelineUi) {
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
					showCompactLoading={isShowDocumentPipelineUi || canResumePreview}
				/>
				{(isShowDocumentPipelineUi || canResumePreview) && (
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
