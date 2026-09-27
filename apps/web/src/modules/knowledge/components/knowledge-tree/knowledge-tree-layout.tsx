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

import { actions } from "../../knowledge.js";
import { EMPTY_LENGTH } from "../../libs/constants/constants.js";
import {
	collectExtractionItemPatches,
	deriveExtractionReviewIds,
} from "../../libs/helpers/helpers.js";
import {
	type KnowledgeState,
	type ProposedPage,
	type ProposedSection,
} from "../../libs/types/types.js";
import {
	getPipelineSessionId,
	isPipelineSessionCurrent,
} from "../../state/session-guards.js";
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
	activeDocumentStatus: KnowledgeState["activeDocumentStatus"];
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

const getPipelineVisibility = ({
	activeDocumentStatus,
	canEdit,
	isAddingKnowledge,
	pipelineProjectId,
	previewProjectId,
	projectId,
	trackedDocuments,
}: {
	activeDocumentStatus: KnowledgeState["activeDocumentStatus"];
	canEdit: boolean;
	isAddingKnowledge: boolean;
	pipelineProjectId: KnowledgeState["pipelineProjectId"];
	previewProjectId: null | string;
	projectId: string;
	trackedDocuments: KnowledgeState["trackedDocuments"];
}): {
	canResumePreview: boolean;
	isPipelineOwned: boolean;
	isPreviewVisible: boolean;
	isShowDocumentPipelineUi: boolean;
} => {
	if (!canEdit || pipelineProjectId !== projectId) {
		return {
			canResumePreview: false,
			isPipelineOwned: false,
			isPreviewVisible: false,
			isShowDocumentPipelineUi: false,
		};
	}

	return {
		canResumePreview:
			activeDocumentStatus === DocumentStatus.WAITING_FOR_VALIDATION ||
			activeDocumentStatus === DocumentStatus.WAITING_FOR_APPROVAL,
		isPipelineOwned: true,
		isPreviewVisible: previewProjectId === projectId,
		isShowDocumentPipelineUi:
			isAddingKnowledge || trackedDocuments.length > EMPTY_LENGTH,
	};
};

const useActiveExtractionItems = ({
	activeDocumentId,
	activeDocumentStatus,
	isPipelineOwned,
	projectId,
}: {
	activeDocumentId: null | number;
	activeDocumentStatus: KnowledgeState["activeDocumentStatus"];
	isPipelineOwned: boolean;
	projectId: string;
}): void => {
	const dispatch = useAppDispatch();

	useEffect(() => {
		if (
			!isPipelineOwned ||
			!activeDocumentId ||
			activeDocumentStatus !== DocumentStatus.WAITING_FOR_VALIDATION
		) {
			return;
		}

		void dispatch(
			actions.fetchExtractionItems({
				documentId: activeDocumentId,
				pipelineSessionId: getPipelineSessionId(),
				projectId,
			}),
		);
	}, [
		activeDocumentId,
		activeDocumentStatus,
		dispatch,
		isPipelineOwned,
		projectId,
	]);
};

type EmptyPipelineProperties = {
	activeDocumentStatus: KnowledgeState["activeDocumentStatus"];
	errorMessage: null | string;
	isPreviewDismissed: boolean;
	isShowDocumentPipelineUi: boolean;
	onCancel: () => void;
	onFinish: () => void;
	onPreview: () => void;
	onRetry: () => void;
};

const KnowledgeTreeEmptyPipeline: React.FC<EmptyPipelineProperties> = ({
	activeDocumentStatus,
	errorMessage,
	isPreviewDismissed,
	isShowDocumentPipelineUi,
	onCancel,
	onFinish,
	onPreview,
	onRetry,
}: EmptyPipelineProperties) => {
	if (!isShowDocumentPipelineUi) {
		return errorMessage ? (
			<div className="flex flex-col items-center gap-4 text-text-muted">
				<p>{errorMessage}</p>
			</div>
		) : (
			<KnowledgeTreeEmptyState />
		);
	}

	if (activeDocumentStatus === DocumentStatus.FAILED) {
		return (
			<LoadingState
				currentStatus={activeDocumentStatus}
				hasError={true}
				onCancel={onCancel}
				onRetry={onRetry}
				variant="full"
			/>
		);
	}

	if (isPreviewDismissed) {
		return (
			<LoadingState
				currentStatus={activeDocumentStatus}
				onPreview={onPreview}
				variant="compact"
			/>
		);
	}

	return (
		<LoadingState
			currentStatus={activeDocumentStatus}
			onFinish={onFinish}
			variant="full"
		/>
	);
};

const KnowledgeTreePreviewLayer: React.FC<PreviewLayerProperties> = ({
	activeDocumentId,
	activeDocumentStatus,
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
		<IntegrationPreview
			key={`extraction-${String(activeDocumentId)}-${String(extractionStructure.length)}`}
			onAddMore={onAddMore}
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
								key={document.documentId}
								onClick={handlePendingReviewClick}
								type="button"
							>
								{document.label}
							</button>
						))}
					</div>
				)}
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
		errorMessage,
		extractionItems,
		isAddingKnowledge,
		isEntryLoading,
		isTreeLoading,
		pipelineProjectId,
		trackedDocuments,
	} = useAppSelector((state) => state.knowledge);
	const [isEditing, setIsEditing] = useState<boolean>(false);

	const {
		hideModal: handleCloseAddModal,
		isOpen: isAddModalOpen,
		showModal: handleOpenAddModal,
	} = useModal();

	const [previewProjectId, setPreviewProjectId] = useState<null | string>(null);
	const [dismissedPreviewDocumentId, setDismissedPreviewDocumentId] = useState<
		null | number
	>(null);
	const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(false);

	const setIsPreviewOpen = useCallback(
		(isOpen: boolean): void => {
			setPreviewProjectId((currentProjectId) => {
				if (isOpen) {
					return projectId;
				}

				return currentProjectId === projectId ? null : currentProjectId;
			});
		},
		[projectId],
	);

	const isKbEmpty = items.length === EMPTY_LENGTH;

	const isExtractionValidationPreview =
		activeDocumentStatus === DocumentStatus.WAITING_FOR_VALIDATION;

	const {
		canResumePreview,
		isPipelineOwned,
		isPreviewVisible,
		isShowDocumentPipelineUi,
	} = getPipelineVisibility({
		activeDocumentStatus,
		canEdit,
		isAddingKnowledge,
		pipelineProjectId,
		previewProjectId,
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

	useActiveExtractionItems({
		activeDocumentId,
		activeDocumentStatus,
		isPipelineOwned,
		projectId,
	});

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
			const pipelineSessionId = getPipelineSessionId();

			const { openPreview } = await dispatch(
				actions.resumeNextPendingReview({ projectId }),
			).unwrap();

			if (!isPipelineSessionCurrent(pipelineSessionId)) {
				return;
			}

			if (openPreview || isClosingWhenNoneLeft) {
				setIsPreviewOpen(openPreview);
			}
		},
		[dispatch, projectId, setIsPreviewOpen],
	);

	const handleApproveIntegration = useCallback((): void => {
		void openNextPendingReview({ isClosingWhenNoneLeft: false });
		void dispatch(actions.fetchKnowledgeTree({ projectId }));
	}, [dispatch, openNextPendingReview, projectId]);

	const handleClosePreview = useCallback((): void => {
		setDismissedPreviewDocumentId(activeDocumentId);
		setIsPreviewOpen(false);
		dispatch(actions.clearIntegrationPreview());
	}, [activeDocumentId, dispatch, setIsPreviewOpen]);

	const handleCloseSidebar = useCallback((): void => {
		setIsSidebarOpen(false);
	}, []);

	const handleFinishLoading = useCallback((): void => {
		dispatch(actions.finishAddingKnowledge());
		setIsPreviewOpen(true);
	}, [dispatch, setIsPreviewOpen]);

	const handleOpenPreview = useCallback((): void => {
		void openNextPendingReview({ isClosingWhenNoneLeft: true });
	}, [openNextPendingReview]);

	const handleOpenSidebar = useCallback((): void => {
		setIsSidebarOpen(true);
	}, []);

	const handleResetState = useCallback((): void => {
		dispatch(actions.clearError());

		if (projectId && activeDocumentId) {
			dispatch(
				actions.untrackDocument({ documentId: activeDocumentId, projectId }),
			);
		}
	}, [activeDocumentId, dispatch, projectId]);

	const handleSwitchDocument = useCallback(
		(documentId: number): void => {
			if (!projectId) {
				return;
			}

			void (async () => {
				const pipelineSessionId = getPipelineSessionId();

				const isSwitched = await dispatch(
					actions.switchActiveDocument({
						documentId,
						pipelineSessionId,
						projectId,
					}),
				).unwrap();

				if (!isPipelineSessionCurrent(pipelineSessionId)) {
					return;
				}

				setIsPreviewOpen(isSwitched);
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

		if (errorMessage || activeDocumentStatus === DocumentStatus.FAILED) {
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
	}, [
		activeDocumentId,
		activeDocumentStatus,
		dispatch,
		errorMessage,
		projectId,
	]);

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

			const pipelineSessionId = getPipelineSessionId();

			try {
				for (const patch of patches) {
					await dispatch(
						actions.updateExtractionItem({
							documentId: activeDocumentId,
							extractionItemId: patch.id,
							payload: { text: patch.text, title: patch.title },
							pipelineSessionId,
							projectId,
						}),
					).unwrap();

					if (!isPipelineSessionCurrent(pipelineSessionId)) {
						return false;
					}
				}

				const response = await dispatch(
					actions.submitExtractionReview({
						documentId: activeDocumentId,
						payload: { approvedIds, rejectedIds },
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
			extractionItems,
			openNextPendingReview,
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
		return (
			<div className="flex h-full w-full items-center justify-center bg-bg">
				<KnowledgeTreeEmptyPipeline
					activeDocumentStatus={activeDocumentStatus}
					errorMessage={errorMessage}
					isPreviewDismissed={
						canResumePreview && dismissedPreviewDocumentId === activeDocumentId
					}
					isShowDocumentPipelineUi={isShowDocumentPipelineUi}
					onCancel={handleResetState}
					onFinish={handleFinishLoading}
					onPreview={handleOpenPreview}
					onRetry={handleRetry}
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
