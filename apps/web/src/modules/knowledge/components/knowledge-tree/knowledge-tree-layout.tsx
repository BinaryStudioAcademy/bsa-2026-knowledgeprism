import {
	DocumentStatus,
	ExtractionItemStatus,
} from "@knowledgeprism/constants";
import {
	type DocumentProcessingProgressDto,
	type KnowledgeEntryResponseDto,
	type KnowledgeEntryUpdateRequestDto,
	type KnowledgeTreeItemResponseDto,
} from "@knowledgeprism/types";
import React, {
	type MouseEvent,
	useCallback,
	useEffect,
	useMemo,
	useRef,
	useState,
} from "react";

import { useAppSidebarOverlay } from "~/app/layouts/app-sidebar-overlay-context.js";
import { useKnowledgeTreePanel } from "~/app/layouts/knowledge-tree-panel-context.js";
import { Loader } from "~/components/components.js";
import {
	useAppDispatch,
	useAppSelector,
	useCurrentProjectId,
	useModal,
} from "~/hooks/hooks.js";

import { actions } from "../../knowledge.js";
import { EMPTY_LENGTH } from "../../libs/constants/constants.js";
import { mapExtractionItemsToProposedStructure } from "../../libs/helpers/helpers.js";
import { resolveApprovedDocumentView } from "../../libs/helpers/resolve-approved-document-view.helper.js";
import {
	type KnowledgeState,
	type ProposedSection,
} from "../../libs/types/types.js";
import {
	getPipelineSessionId,
	isPipelineSessionCurrent,
} from "../../state/session-guards.js";
import { AddKnowledgeModal } from "../add-knowledge-modal/add-knowledge-modal.js";
import { DocumentProcessingList } from "../loading-state/document-processing-list.js";
import { LoadingState } from "../loading-state/loading-state.js";
import { IntegrationPreviewPanel } from "./integration-preview-panel.js";
import { KnowledgeTreeContent } from "./knowledge-tree-content.js";
import { KnowledgeTreeEmptyState } from "./knowledge-tree-empty-state.js";
import { KnowledgeTreeHeader } from "./knowledge-tree-header.js";
import { KnowledgeTreeSidebar } from "./knowledge-tree-sidebar.js";

type PreviewLayerProperties = {
	activeDocumentId: null | number;
	extractionFailedPageNumbers: number[];
	extractionStructure: ProposedSection[];
	isAddModalOpen: boolean;
	isReviewMutationPending: boolean;
	onAddMore: () => void;
	onApplyingChange: (isApplying: boolean) => void;
	onApproveIntegration: () => void;
	onCancelDocument: () => void;
	onCloseAddModal: () => void;
	onClosePreview: () => void;
	onSwitchDocument: (documentId: number) => void;
	pendingReviewDocuments: { documentId: number; label: string }[];
	pipelineErrorMessage: null | string;
	projectId: null | string;
};

const PLACEMENT_REVIEW_STATUSES = new Set<
	KnowledgeState["activeDocumentStatus"]
>([DocumentStatus.WAITING_FOR_APPROVAL]);

const isPlacementReviewStatus = (
	status: KnowledgeState["activeDocumentStatus"],
): boolean => {
	return PLACEMENT_REVIEW_STATUSES.has(status);
};

const openPlacementReviewWhenReady = ({
	activeDocumentStatus,
	isDismissed,
	pipelineSessionId,
	previewSessionId,
	setIsPreviewOpen,
}: {
	activeDocumentStatus: KnowledgeState["activeDocumentStatus"];
	isDismissed: boolean;
	pipelineSessionId: number;
	previewSessionId: null | number;
	setIsPreviewOpen: (isOpen: boolean) => void;
}): void => {
	if (
		!isDismissed &&
		previewSessionId !== pipelineSessionId &&
		isPlacementReviewStatus(activeDocumentStatus)
	) {
		setIsPreviewOpen(true);
	}
};

const isDismissedPlacementPreview = ({
	activeDocumentId,
	dismissedPreview,
	pipelineSessionId,
}: {
	activeDocumentId: null | number;
	dismissedPreview: null | {
		documentId: number;
		pipelineSessionId: number;
	};
	pipelineSessionId: number;
}): boolean => {
	return (
		activeDocumentId !== null &&
		dismissedPreview !== null &&
		dismissedPreview.documentId === activeDocumentId &&
		dismissedPreview.pipelineSessionId === pipelineSessionId
	);
};

type Properties = {
	canEdit?: boolean;
	entries: Record<number, KnowledgeEntryResponseDto>;
	isSectionsLoading?: boolean;
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
		canResumePreview: isPlacementReviewStatus(activeDocumentStatus),
		isPreviewVisible:
			previewSessionId === pipelineSessionId &&
			isPlacementReviewStatus(activeDocumentStatus) &&
			extractionItemsDocumentId === activeDocumentId,
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

	const isPlacementPhase = isPlacementReviewStatus(activeDocumentStatus);
	let pipelineContent = isPlacementPhase ? (
		<LoadingState
			currentStatus={activeDocumentStatus}
			onPreview={onPreview}
			variant="compact"
		/>
	) : (
		<LoadingState
			currentStatus={activeDocumentStatus}
			onCancel={onCancel}
			onFinish={onFinish}
			progress={progress}
			variant="full"
		/>
	);

	if (pipelineErrorMessage || activeDocumentStatus === DocumentStatus.FAILED) {
		pipelineContent = (
			<LoadingState
				currentStatus={activeDocumentStatus}
				errorMessage={pipelineErrorMessage}
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
	extractionFailedPageNumbers,
	extractionStructure,
	isAddModalOpen,
	isReviewMutationPending,
	onAddMore,
	onApplyingChange,
	onApproveIntegration,
	onCancelDocument,
	onCloseAddModal,
	onClosePreview,
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

	const previewContent = (
		<IntegrationPreviewPanel
			documentId={activeDocumentId ?? undefined}
			extractionStructure={extractionStructure}
			failedPageNumbers={extractionFailedPageNumbers}
			onAddMore={onAddMore}
			onApplyingChange={onApplyingChange}
			onApprove={onApproveIntegration}
			onCancelDocument={onCancelDocument}
			onClose={onClosePreview}
			pipelineErrorMessage={pipelineErrorMessage}
			projectId={projectId}
		/>
	);

	return (
		<>
			<div className="flex h-full w-full flex-col bg-bg">
				{pendingReviewDocuments.length > EMPTY_LENGTH && (
					<div className="flex max-h-24 shrink-0 flex-wrap overflow-y-auto items-center gap-2 border-b border-border bg-surface px-4 py-2 text-sm">
						<span className="text-text-muted">Also waiting for review:</span>
						{pendingReviewDocuments.map((document) => (
							<button
								className="cursor-pointer disabled:cursor-not-allowed rounded-md border border-border px-2 py-1 text-text hover:bg-secondary"
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

type ApprovedReading = {
	entry: KnowledgeEntryResponseDto | undefined;
	isDocumentReady: boolean;
	sections: KnowledgeEntryResponseDto[] | undefined;
};

const selectApprovedReading = ({
	documentView,
	entries,
	sectionEntries,
	selectedPageId,
}: {
	documentView: ReturnType<typeof resolveApprovedDocumentView>;
	entries: Record<number, KnowledgeEntryResponseDto>;
	sectionEntries: KnowledgeEntryResponseDto[];
	selectedPageId: number | undefined;
}): ApprovedReading => {
	const selectedEntry =
		selectedPageId === undefined ? undefined : entries[selectedPageId];
	const documentEntry = documentView
		? entries[documentView.documentId]
		: undefined;
	const isDocumentReady = Boolean(
		documentView &&
		documentEntry &&
		documentView.sectionIds.every((sectionId) => entries[sectionId]),
	);

	if (!isDocumentReady || !documentView || !documentEntry) {
		return {
			entry: selectedEntry,
			isDocumentReady,
			sections: undefined,
		};
	}

	return {
		entry: documentEntry,
		isDocumentReady,
		sections: sectionEntries,
	};
};

const KnowledgeTreeLayout: React.FC<Properties> = ({
	canEdit = false,
	entries,
	isSectionsLoading = false,
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
		integrationPreviewDocumentId,
		isAddingKnowledge,
		isDocumentStructurePending,
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
	const [isTreeCollapsed, setIsTreeCollapsed] = useState<boolean>(false);
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

	const isActivePreviewDismissed = isDismissedPlacementPreview({
		activeDocumentId,
		dismissedPreview,
		pipelineSessionId,
	});

	openPlacementReviewWhenReady({
		activeDocumentStatus,
		isDismissed: isActivePreviewDismissed,
		pipelineSessionId,
		previewSessionId,
		setIsPreviewOpen,
	});

	const activePipelineError =
		activeDocumentId === null
			? null
			: (pipelineErrors[activeDocumentId] ?? null);

	const isKbEmpty = items.length === EMPTY_LENGTH;

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
				isPlacementReviewStatus(document.status),
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

	const handleShowTree = useCallback((): void => {
		setIsTreeCollapsed(false);
	}, []);
	const { registerOpenKnowledgeTree } = useKnowledgeTreePanel();

	useEffect(() => {
		return registerOpenKnowledgeTree(handleShowTree);
	}, [handleShowTree, registerOpenKnowledgeTree]);

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

	const handleCancelDocument = useCallback((): void => {
		if (!projectId || !activeDocumentId) {
			return;
		}

		void (async () => {
			try {
				await dispatch(
					actions.cancelDocument({
						documentId: activeDocumentId,
						projectId,
					}),
				).unwrap();
				await openNextPendingReview({ isClosingWhenNoneLeft: true });
			} catch {
				// Errors are surfaced globally.
			}
		})();
	}, [activeDocumentId, dispatch, openNextPendingReview, projectId]);

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
		} else if (isPlacementReviewStatus(activeDocumentStatus)) {
			void dispatch(actions.fetchExtractionItems(request));

			if (activeDocumentStatus === DocumentStatus.WAITING_FOR_APPROVAL) {
				void dispatch(actions.fetchIntegrationChanges(request));
			}
		} else {
			void dispatch(actions.pollDocumentStatus(request));
		}
	}, [activeDocumentId, activeDocumentStatus, dispatch, projectId]);

	const reviewExtractionItems = useMemo(
		() =>
			extractionItems.filter(
				(item) => item.status !== ExtractionItemStatus.REJECTED,
			),
		[extractionItems],
	);

	const mappedExtractionStructure = useMemo(
		() =>
			mapExtractionItemsToProposedStructure(
				reviewExtractionItems,
				extractionSections,
			),
		[extractionSections, reviewExtractionItems],
	);

	const requestedExtractionDocumentId = useRef<null | number>(null);

	useEffect(() => {
		if (!projectId || activeDocumentId === null) {
			return;
		}

		if (!isPlacementReviewStatus(activeDocumentStatus)) {
			return;
		}

		const request = {
			documentId: activeDocumentId,
			pipelineSessionId,
			projectId,
		};

		if (
			extractionItemsDocumentId !== activeDocumentId &&
			requestedExtractionDocumentId.current !== activeDocumentId
		) {
			requestedExtractionDocumentId.current = activeDocumentId;
			void dispatch(actions.fetchExtractionItems(request));
		}

		if (
			integrationPreviewDocumentId !== activeDocumentId &&
			activeDocumentStatus === DocumentStatus.WAITING_FOR_APPROVAL
		) {
			void dispatch(actions.fetchIntegrationChanges(request));
		}
	}, [
		activeDocumentId,
		activeDocumentStatus,
		dispatch,
		extractionItemsDocumentId,
		integrationPreviewDocumentId,
		pipelineSessionId,
		projectId,
	]);

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

	const handleRemoveSection = useCallback(
		async (sectionId: number): Promise<void> => {
			if (!projectId) {
				return;
			}

			await dispatch(
				actions.removeKnowledgeSection({
					projectId,
					sectionId,
				}),
			).unwrap();
		},
		[dispatch, projectId],
	);

	const handleSaveSection = useCallback(
		async (
			sectionId: number,
			payload: KnowledgeEntryUpdateRequestDto,
		): Promise<void> => {
			if (!projectId) {
				return;
			}

			await dispatch(
				actions.updateKnowledgeEntry({
					entryId: sectionId,
					payload,
					projectId,
				}),
			).unwrap();
		},
		[dispatch, projectId],
	);

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

	const handleEditNode = useCallback(
		(id: number): void => {
			onSelectPage(id);
			setIsEditing(true);
		},
		[onSelectPage],
	);

	const handleCreateDocument = useCallback(
		(title: string, parentId: null | number): void => {
			if (!projectId) {
				return;
			}

			void dispatch(
				actions.createDocumentNode({
					parentId,
					projectId,
					title,
				}),
			)
				.unwrap()
				.then((result) => {
					handleSelectPage(result.entry.id);
				})
				.catch(() => {
					// The error middleware shows the failure.
				});
		},
		[dispatch, handleSelectPage, projectId],
	);

	const handleMoveDocument = useCallback(
		(
			documentId: number,
			placement: { parentId: null | number; position: number },
		): void => {
			if (!projectId) {
				return;
			}

			void dispatch(
				actions.moveDocumentNode({
					documentId,
					parentId: placement.parentId,
					position: placement.position,
					projectId,
				}),
			);
		},
		[dispatch, projectId],
	);

	const documentView = useMemo(
		() => resolveApprovedDocumentView(items, selectedPageId),
		[items, selectedPageId],
	);
	const sectionEntries = useMemo(() => {
		if (!documentView) {
			return [];
		}

		return documentView.sectionIds.flatMap((sectionId) => {
			const section = entries[sectionId];

			return section ? [section] : [];
		});
	}, [documentView, entries]);

	if (isPreviewVisible) {
		return (
			<KnowledgeTreePreviewLayer
				activeDocumentId={activeDocumentId}
				extractionFailedPageNumbers={extractionFailedPageNumbers}
				extractionStructure={mappedExtractionStructure}
				isAddModalOpen={isAddModalOpen}
				isReviewMutationPending={isReviewMutationPending}
				onAddMore={handleAddMore}
				onApplyingChange={handleReviewMutationChange}
				onApproveIntegration={handleApproveIntegration}
				onCancelDocument={handleCancelDocument}
				onCloseAddModal={handleCloseAddModal}
				onClosePreview={handleClosePreview}
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
		return (
			<div className="@container flex h-full w-full bg-bg">
				{canEdit && !isShowDocumentPipelineUi && (
					<KnowledgeTreeSidebar
						canStructure={canEdit}
						isCollapsed={isTreeCollapsed}
						isOpen={isSidebarOpen}
						isStructurePending={isDocumentStructurePending}
						items={items}
						onClose={handleCloseSidebar}
						onCreateDocument={handleCreateDocument}
						onEditNode={handleEditNode}
						onMoveDocument={handleMoveDocument}
						onSelectPage={handleSelectPage}
						selectedPageId={selectedPageId}
					/>
				)}
				<div className="flex min-w-0 flex-1 flex-col overflow-hidden">
					<div className="block @5xl:hidden">
						<KnowledgeTreeHeader
							breadcrumbs={[]}
							canEdit={false}
							currentStatus={activeDocumentStatus}
							hasError={Boolean(activePipelineError)}
							isEditing={false}
							onCancel={handleCancelEdit}
							onEdit={handleStartEdit}
							onOpenSidebar={handleOpenSidebar}
							onPreview={handleOpenPreview}
							onResetState={handleCancelDocument}
							onRetry={handleRetry}
							progress={progress}
							showCompactLoading={false}
						/>
					</div>
					<div className="flex min-w-0 flex-1 flex-col items-center overflow-y-auto pt-8">
						<DocumentProcessingList />
						<KnowledgeTreeEmptyPipeline
							activeDocumentStatus={activeDocumentStatus}
							isPreviewDismissed={canResumePreview && isActivePreviewDismissed}
							isShowDocumentPipelineUi={isShowDocumentPipelineUi}
							knowledgeErrorMessage={knowledgeErrorMessage}
							onCancel={handleCancelDocument}
							onFinish={handleFinishLoading}
							onPreview={handleOpenPreview}
							onRetry={handleRetry}
							pipelineErrorMessage={activePipelineError}
							progress={progress}
						/>
					</div>
				</div>
				<AddKnowledgeModal
					isOpen={isAddModalOpen}
					onClose={handleCloseAddModal}
				/>
			</div>
		);
	}

	const reading = selectApprovedReading({
		documentView,
		entries,
		sectionEntries,
		selectedPageId,
	});

	let mainContent = (
		<div className="flex flex-1 items-center justify-center text-text-muted">
			{knowledgeErrorMessage ?? "Select a page to view its content."}
		</div>
	);

	if (
		isEntryLoading ||
		(isSectionsLoading && !reading.isDocumentReady) ||
		(!knowledgeErrorMessage && selectedPageId && !reading.entry)
	) {
		mainContent = (
			<div className="flex flex-1 items-center justify-center">
				<Loader />
			</div>
		);
	} else if (reading.entry) {
		mainContent = (
			<KnowledgeTreeContent
				entry={reading.entry}
				isEditing={isEditing}
				onCancel={handleCancelEdit}
				onRemoveSection={handleRemoveSection}
				onSaveSection={handleSaveSection}
				sections={reading.sections}
			/>
		);
	}

	return (
		<div className="@container flex h-full w-full bg-bg">
			<KnowledgeTreeSidebar
				canStructure={canEdit}
				isCollapsed={isTreeCollapsed}
				isOpen={isSidebarOpen}
				isStructurePending={isDocumentStructurePending}
				items={items}
				onClose={handleCloseSidebar}
				onCreateDocument={handleCreateDocument}
				onEditNode={handleEditNode}
				onMoveDocument={handleMoveDocument}
				onSelectPage={handleSelectPage}
				selectedPageId={selectedPageId}
			/>
			<div className="flex min-w-0 flex-1 flex-col overflow-hidden">
				<KnowledgeTreeHeader
					breadcrumbs={breadcrumbs}
					canEdit={canEdit}
					currentStatus={activeDocumentStatus}
					errorMessage={activePipelineError}
					hasError={Boolean(activePipelineError)}
					isEditing={isEditing}
					onCancel={handleCancelEdit}
					onEdit={handleStartEdit}
					onOpenSidebar={handleOpenSidebar}
					onPreview={handleOpenPreview}
					onResetState={handleCancelDocument}
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
								errorMessage={activePipelineError}
								hasError={true}
								onCancel={handleCancelDocument}
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
