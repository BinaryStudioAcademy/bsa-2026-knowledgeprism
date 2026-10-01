import {
	DocumentStatus,
	ExtractionItemStatus,
} from "@knowledgeprism/constants";
import {
	type DocumentProcessingProgressDto,
	type KnowledgeEntryResponseDto,
	type KnowledgeTreeItemResponseDto,
} from "@knowledgeprism/types";
import React, { type MouseEvent, useCallback, useMemo, useState } from "react";

import { useAppSidebarOverlay } from "~/app/layouts/app-sidebar-overlay-context.js";
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
	mapExtractionItemsToProposedStructure,
	toExtractionReviewPayload,
} from "../../libs/helpers/helpers.js";
import {
	type KnowledgeState,
	type ProposedSection,
} from "../../libs/types/types.js";
import {
	getPipelineSessionId,
	isPipelineSessionCurrent,
} from "../../state/session-guards.js";
import { AddKnowledgeModal } from "../add-knowledge-modal/add-knowledge-modal.js";
import { IntegrationPreview } from "../integration-preview/integration-preview.js";
import { DocumentProcessingList } from "../loading-state/document-processing-list.js";
import { LoadingState } from "../loading-state/loading-state.js";
import { IntegrationPreviewPanel } from "./integration-preview-panel.js";
import { KnowledgeTreeContent } from "./knowledge-tree-content.js";
import { KnowledgeTreeEmptyState } from "./knowledge-tree-empty-state.js";
import { KnowledgeTreeHeader } from "./knowledge-tree-header.js";
import { KnowledgeTreeSidebar } from "./knowledge-tree-sidebar.js";

type PreviewLayerProperties = {
	activeDocumentId: null | number;
	activeDocumentStatus: KnowledgeState["activeDocumentStatus"];
	extractionFailedPageNumbers: number[];
	extractionStructure: ProposedSection[];
	isAddModalOpen: boolean;
	isExtractionValidationPreview: boolean;
	isReviewMutationPending: boolean;
	onAddMore: () => void;
	onApplyingChange: (isApplying: boolean) => void;
	onApproveIntegration: () => void;
	onCloseAddModal: () => void;
	onClosePreview: () => void;
	onExtractionValidationApprove: (pages: ProposedSection[]) => Promise<boolean>;
	onSwitchDocument: (documentId: number) => void;
	pendingReviewDocuments: { documentId: number; label: string }[];
	pipelineErrorMessage: null | string;
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

const getPipelineVisibility = ({
	activeDocumentId,
	activeDocumentStatus,
	canEdit,
	extractionItemsDocumentId,
	isAddingKnowledge,
	pipelineProjectId,
	pipelineSessionId,
	previewSessionId,
	projectId,
	trackedDocuments,
}: {
	activeDocumentId: null | number;
	activeDocumentStatus: KnowledgeState["activeDocumentStatus"];
	canEdit: boolean;
	extractionItemsDocumentId: null | number;
	isAddingKnowledge: boolean;
	pipelineProjectId: KnowledgeState["pipelineProjectId"];
	pipelineSessionId: number;
	previewSessionId: null | number;
	projectId: string;
	trackedDocuments: KnowledgeState["trackedDocuments"];
}): {
	canResumePreview: boolean;
	isPreviewVisible: boolean;
	isShowDocumentPipelineUi: boolean;
} => {
	if (!canEdit || pipelineProjectId !== projectId) {
		return {
			canResumePreview: false,
			isPreviewVisible: false,
			isShowDocumentPipelineUi: false,
		};
	}

	return {
		canResumePreview:
			activeDocumentStatus === DocumentStatus.WAITING_FOR_VALIDATION ||
			activeDocumentStatus === DocumentStatus.WAITING_FOR_APPROVAL,
		isPreviewVisible:
			previewSessionId === pipelineSessionId &&
			(activeDocumentStatus === DocumentStatus.WAITING_FOR_APPROVAL ||
				(activeDocumentStatus === DocumentStatus.WAITING_FOR_VALIDATION &&
					extractionItemsDocumentId === activeDocumentId)),
		isShowDocumentPipelineUi:
			isAddingKnowledge || trackedDocuments.length > EMPTY_LENGTH,
	};
};

type EmptyPipelineProperties = {
	activeDocumentStatus: KnowledgeState["activeDocumentStatus"];
	isPreviewDismissed: boolean;
	isShowDocumentPipelineUi: boolean;
	knowledgeErrorMessage: null | string;
	onCancel: () => void;
	onFinish: () => void;
	onPreview: () => void;
	onRetry: () => void;
	pipelineErrorMessage: null | string;
	progress: DocumentProcessingProgressDto | null;
};

const KnowledgeTreeEmptyPipeline: React.FC<EmptyPipelineProperties> = ({
	activeDocumentStatus,
	isPreviewDismissed,
	isShowDocumentPipelineUi,
	knowledgeErrorMessage,
	onCancel,
	onFinish,
	onPreview,
	onRetry,
	pipelineErrorMessage,
	progress,
}: EmptyPipelineProperties) => {
	if (!isShowDocumentPipelineUi) {
		return knowledgeErrorMessage ? (
			<div className="flex flex-col items-center gap-4 text-text-muted">
				<p>{knowledgeErrorMessage}</p>
			</div>
		) : (
			<KnowledgeTreeEmptyState />
		);
	}

	let pipelineContent = (
		<LoadingState
			currentStatus={activeDocumentStatus}
			onFinish={onFinish}
			progress={progress}
			variant="full"
		/>
	);

	if (pipelineErrorMessage || activeDocumentStatus === DocumentStatus.FAILED) {
		pipelineContent = (
			<LoadingState
				currentStatus={activeDocumentStatus}
				hasError={true}
				onCancel={onCancel}
				onRetry={onRetry}
				progress={progress}
				variant="full"
			/>
		);
	} else if (isPreviewDismissed) {
		pipelineContent = (
			<LoadingState
				currentStatus={activeDocumentStatus}
				onPreview={onPreview}
				progress={progress}
				variant="compact"
			/>
		);
	}

	return (
		<div className="flex flex-col items-center gap-4">
			{knowledgeErrorMessage && (
				<p className="text-text-muted">{knowledgeErrorMessage}</p>
			)}
			{pipelineContent}
		</div>
	);
};

const KnowledgeTreePreviewLayer: React.FC<PreviewLayerProperties> = ({
	activeDocumentId,
	activeDocumentStatus,
	extractionFailedPageNumbers,
	extractionStructure,
	isAddModalOpen,
	isExtractionValidationPreview,
	isReviewMutationPending,
	onAddMore,
	onApplyingChange,
	onApproveIntegration,
	onCloseAddModal,
	onClosePreview,
	onExtractionValidationApprove,
	onSwitchDocument,
	pendingReviewDocuments,
	pipelineErrorMessage,
	projectId,
}: PreviewLayerProperties) => {
	const handlePendingReviewClick = useCallback(
		(event: MouseEvent<HTMLButtonElement>): void => {
			if (isReviewMutationPending) {
				return;
			}

			const documentId = Number(event.currentTarget.dataset["documentId"]);

			if (Number.isFinite(documentId)) {
				onSwitchDocument(documentId);
			}
		},
		[isReviewMutationPending, onSwitchDocument],
	);

	const previewContent = isExtractionValidationPreview ? (
		<IntegrationPreview
			errorMessage={pipelineErrorMessage}
			failedPageNumbers={extractionFailedPageNumbers}
			key={`extraction-${String(activeDocumentId)}-${String(extractionStructure.length)}`}
			onAddMore={onAddMore}
			onApplyingChange={onApplyingChange}
			onApproveExtraction={onExtractionValidationApprove}
			onClose={onClosePreview}
			proposedStructure={extractionStructure}
			variant="extraction-validation"
		/>
	) : (
		<IntegrationPreviewPanel
			documentId={
				activeDocumentStatus === DocumentStatus.WAITING_FOR_APPROVAL
					? (activeDocumentId ?? undefined)
					: undefined
			}
			onAddMore={onAddMore}
			onApplyingChange={onApplyingChange}
			onApprove={onApproveIntegration}
			onClose={onClosePreview}
			projectId={projectId}
		/>
	);

	return (
		<>
			<div className="flex h-full w-full flex-col bg-bg">
				{pendingReviewDocuments.length > EMPTY_LENGTH && (
					<div className="flex flex-wrap items-center gap-2 border-b border-border bg-surface px-4 py-2 text-sm">
						<span className="text-text-muted">Also waiting for review:</span>
						{pendingReviewDocuments.map((document) => (
							<button
								className="rounded-md border border-border px-2 py-1 text-text hover:bg-secondary"
								data-document-id={document.documentId}
								disabled={isReviewMutationPending}
								key={document.documentId}
								onClick={handlePendingReviewClick}
								type="button"
							>
								{document.label}
							</button>
						))}
					</div>
				)}
				<DocumentProcessingList />
				<div className="min-h-0 flex-1">{previewContent}</div>
			</div>
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
		documentStatuses,
		extractionFailedPageNumbers,
		extractionItems,
		extractionItemsDocumentId,
		extractionSections,
		isAddingKnowledge,
		isEntryLoading,
		isTreeLoading,
		knowledgeErrorMessage,
		pipelineErrors,
		pipelineProjectId,
		pipelineSessionId,
		trackedDocuments,
	} = useAppSelector((state) => state.knowledge);
	const progress =
		activeDocumentId === null
			? null
			: (documentStatuses[activeDocumentId]?.processingProgress ?? null);
	const [isEditing, setIsEditing] = useState<boolean>(false);
	const [reviewMutationSessionId, setReviewMutationSessionId] = useState<
		null | number
	>(null);
	const isReviewMutationPending = reviewMutationSessionId === pipelineSessionId;

	const handleReviewMutationChange = useCallback(
		(isApplying: boolean): void => {
			if (isPipelineSessionCurrent(pipelineSessionId)) {
				setReviewMutationSessionId(isApplying ? pipelineSessionId : null);
			}
		},
		[pipelineSessionId],
	);

	const {
		hideModal: handleCloseAddModal,
		isOpen: isAddModalOpen,
		showModal: handleOpenAddModal,
	} = useModal();

	const [previewSessionId, setPreviewSessionId] = useState<null | number>(null);
	const [dismissedPreview, setDismissedPreview] = useState<null | {
		documentId: number;
		pipelineSessionId: number;
	}>(null);
	const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(false);
	const { closeOverlay, isOverlayOpen } = useAppSidebarOverlay();
	const [wasOverlayOpen, setWasOverlayOpen] = useState(isOverlayOpen);

	if (wasOverlayOpen !== isOverlayOpen) {
		setWasOverlayOpen(isOverlayOpen);

		if (isOverlayOpen) {
			setIsSidebarOpen(false);
		}
	}

	const setIsPreviewOpen = useCallback(
		(isOpen: boolean): void => {
			setPreviewSessionId(isOpen ? pipelineSessionId : null);
		},
		[pipelineSessionId],
	);

	const activePipelineError =
		activeDocumentId === null
			? null
			: (pipelineErrors[activeDocumentId] ?? null);

	const isKbEmpty = items.length === EMPTY_LENGTH;

	const isExtractionValidationPreview =
		activeDocumentStatus === DocumentStatus.WAITING_FOR_VALIDATION;

	const { canResumePreview, isPreviewVisible, isShowDocumentPipelineUi } =
		getPipelineVisibility({
			activeDocumentId,
			activeDocumentStatus,
			canEdit,
			extractionItemsDocumentId,
			isAddingKnowledge,
			pipelineProjectId,
			pipelineSessionId,
			previewSessionId,
			projectId,
			trackedDocuments,
		});

	const pendingReviewDocuments = useMemo(() => {
		return trackedDocuments.filter(
			(document) =>
				document.documentId !== activeDocumentId &&
				(document.status === DocumentStatus.WAITING_FOR_VALIDATION ||
					document.status === DocumentStatus.WAITING_FOR_APPROVAL),
		);
	}, [activeDocumentId, trackedDocuments]);

	const handleAddMore = useCallback((): void => {
		setIsPreviewOpen(false);
		dispatch(actions.clearIntegrationPreview());
		handleOpenAddModal();
	}, [dispatch, handleOpenAddModal, setIsPreviewOpen]);

	const openNextPendingReview = useCallback(
		async ({
			isClosingWhenNoneLeft,
		}: {
			isClosingWhenNoneLeft: boolean;
		}): Promise<void> => {
			const requestedPipelineSessionId = getPipelineSessionId();

			try {
				const { openPreview } = await dispatch(
					actions.resumeNextPendingReview({ projectId }),
				).unwrap();

				if (!isPipelineSessionCurrent(requestedPipelineSessionId)) {
					return;
				}

				if (openPreview || isClosingWhenNoneLeft) {
					setIsPreviewOpen(openPreview);
				}
			} catch {
				if (
					isClosingWhenNoneLeft &&
					isPipelineSessionCurrent(requestedPipelineSessionId)
				) {
					setIsPreviewOpen(false);
				}
			}
		},
		[dispatch, projectId, setIsPreviewOpen],
	);

	const handleApproveIntegration = useCallback((): void => {
		void openNextPendingReview({ isClosingWhenNoneLeft: false });
		void dispatch(actions.fetchKnowledgeTree({ projectId }));
	}, [dispatch, openNextPendingReview, projectId]);

	const handleClosePreview = useCallback((): void => {
		if (activeDocumentId !== null) {
			setDismissedPreview({
				documentId: activeDocumentId,
				pipelineSessionId,
			});
		}
		setIsPreviewOpen(false);
		dispatch(actions.clearIntegrationPreview());
	}, [activeDocumentId, dispatch, pipelineSessionId, setIsPreviewOpen]);

	const handleCloseSidebar = useCallback((): void => {
		setIsSidebarOpen(false);
	}, []);

	const handleFinishLoading = useCallback((): void => {
		void openNextPendingReview({ isClosingWhenNoneLeft: true });
	}, [openNextPendingReview]);

	const handleOpenPreview = useCallback((): void => {
		void openNextPendingReview({ isClosingWhenNoneLeft: true });
	}, [openNextPendingReview]);

	const handleOpenSidebar = useCallback((): void => {
		closeOverlay();
		setIsSidebarOpen(true);
	}, [closeOverlay]);

	const handleResetState = useCallback((): void => {
		if (projectId && activeDocumentId) {
			void dispatch(
				actions.cancelDocument({ documentId: activeDocumentId, projectId }),
			);
		}
	}, [activeDocumentId, dispatch, projectId]);

	const handleSwitchDocument = useCallback(
		(documentId: number): void => {
			if (!projectId) {
				return;
			}

			void (async () => {
				const requestedPipelineSessionId = getPipelineSessionId();

				try {
					const { isLatest, isSwitched } = await dispatch(
						actions.switchActiveDocument({
							documentId,
							pipelineSessionId: requestedPipelineSessionId,
							projectId,
						}),
					).unwrap();

					if (
						!isLatest ||
						!isPipelineSessionCurrent(requestedPipelineSessionId)
					) {
						return;
					}

					setIsPreviewOpen(isSwitched);
				} catch {
					// The previous document remains active and the error is surfaced globally.
				}
			})();
		},
		[dispatch, projectId, setIsPreviewOpen],
	);

	const handleRetry = useCallback((): void => {
		if (!projectId || !activeDocumentId) {
			return;
		}

		const request = {
			documentId: activeDocumentId,
			pipelineSessionId: getPipelineSessionId(),
			projectId,
		};

		if (activeDocumentStatus === DocumentStatus.FAILED) {
			void (async () => {
				try {
					await dispatch(actions.retryDocumentProcessing(request)).unwrap();

					void dispatch(actions.pollDocumentStatus(request));
				} catch {
					// Redux handles the error state
				}
			})();
		} else if (activeDocumentStatus === DocumentStatus.WAITING_FOR_VALIDATION) {
			void dispatch(actions.fetchExtractionItems(request));
		} else {
			void dispatch(actions.pollDocumentStatus(request));
		}
	}, [activeDocumentId, activeDocumentStatus, dispatch, projectId]);

	const pendingExtractionItems = useMemo(
		() =>
			extractionItems.filter(
				(item) => item.status === ExtractionItemStatus.PENDING,
			),
		[extractionItems],
	);

	const mappedExtractionStructure = useMemo(
		() =>
			mapExtractionItemsToProposedStructure(
				pendingExtractionItems,
				extractionSections,
			),
		[extractionSections, pendingExtractionItems],
	);

	const submitExtractionValidation = useCallback(
		async (pages: ProposedSection[]): Promise<boolean> => {
			if (!activeDocumentId || !projectId) {
				return false;
			}

			const payload = toExtractionReviewPayload(pages, pendingExtractionItems);

			const pipelineSessionId = getPipelineSessionId();

			try {
				const response = await dispatch(
					actions.submitExtractionReview({
						documentId: activeDocumentId,
						payload,
						pipelineSessionId,
						projectId,
					}),
				).unwrap();

				if (!isPipelineSessionCurrent(pipelineSessionId)) {
					return false;
				}

				if (response.status === DocumentStatus.INTEGRATING) {
					void dispatch(
						actions.pollDocumentStatus({
							documentId: activeDocumentId,
							pipelineSessionId,
							projectId,
						}),
					);
				} else if (response.status === DocumentStatus.COMPLETED) {
					void dispatch(actions.fetchKnowledgeTree({ projectId }));
				}

				await openNextPendingReview({ isClosingWhenNoneLeft: true });

				return true;
			} catch {
				return false;
			}
		},
		[
			activeDocumentId,
			dispatch,
			openNextPendingReview,
			pendingExtractionItems,
			projectId,
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

	if (isPreviewVisible) {
		return (
			<KnowledgeTreePreviewLayer
				activeDocumentId={activeDocumentId}
				activeDocumentStatus={activeDocumentStatus}
				extractionFailedPageNumbers={extractionFailedPageNumbers}
				extractionStructure={mappedExtractionStructure}
				isAddModalOpen={isAddModalOpen}
				isExtractionValidationPreview={isExtractionValidationPreview}
				isReviewMutationPending={isReviewMutationPending}
				onAddMore={handleAddMore}
				onApplyingChange={handleReviewMutationChange}
				onApproveIntegration={handleApproveIntegration}
				onCloseAddModal={handleCloseAddModal}
				onClosePreview={handleClosePreview}
				onExtractionValidationApprove={handleExtractionValidationApprove}
				onSwitchDocument={handleSwitchDocument}
				pendingReviewDocuments={pendingReviewDocuments}
				pipelineErrorMessage={activePipelineError}
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
		const isActivePreviewDismissed =
			activeDocumentId !== null &&
			dismissedPreview !== null &&
			dismissedPreview.documentId === activeDocumentId &&
			dismissedPreview.pipelineSessionId === pipelineSessionId;

		return (
			<div className="flex h-full w-full flex-col items-center overflow-y-auto bg-bg">
				<DocumentProcessingList />
				<KnowledgeTreeEmptyPipeline
					activeDocumentStatus={activeDocumentStatus}
					isPreviewDismissed={canResumePreview && isActivePreviewDismissed}
					isShowDocumentPipelineUi={isShowDocumentPipelineUi}
					knowledgeErrorMessage={knowledgeErrorMessage}
					onCancel={handleResetState}
					onFinish={handleFinishLoading}
					onPreview={handleOpenPreview}
					onRetry={handleRetry}
					pipelineErrorMessage={activePipelineError}
					progress={progress}
				/>
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
			{knowledgeErrorMessage ?? "Select a page to view its content."}
		</div>
	);

	if (
		isEntryLoading ||
		(selectedPageId && !selectedEntry && !knowledgeErrorMessage)
	) {
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
					hasError={Boolean(activePipelineError)}
					isEditing={isEditing}
					onCancel={handleCancelEdit}
					onEdit={handleStartEdit}
					onOpenSidebar={handleOpenSidebar}
					onPreview={handleOpenPreview}
					onResetState={handleResetState}
					onRetry={handleRetry}
					progress={progress}
					showCompactLoading={isShowDocumentPipelineUi || canResumePreview}
				/>
				{(isShowDocumentPipelineUi || canResumePreview) && (
					<div className="border-b border-border bg-surface px-4 py-4 @5xl:hidden">
						{Boolean(activePipelineError) ||
						activeDocumentStatus === DocumentStatus.FAILED ? (
							<LoadingState
								currentStatus={activeDocumentStatus}
								hasError={true}
								onCancel={handleResetState}
								onRetry={handleRetry}
								progress={progress}
								variant="compact"
							/>
						) : (
							<LoadingState
								currentStatus={activeDocumentStatus}
								onPreview={handleOpenPreview}
								progress={progress}
								variant="compact"
							/>
						)}
					</div>
				)}
				<DocumentProcessingList />
				{mainContent}
			</div>
			<AddKnowledgeModal
				isOpen={isAddModalOpen}
				onClose={handleCloseAddModal}
			/>
		</div>
	);
};

export { getPipelineVisibility, KnowledgeTreeLayout };
