import { DocumentStatus } from "@knowledgeprism/constants";
import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

import { type ValueOf } from "~/lib/types/types.js";

import { DocumentValidationMessage } from "../libs/constants/constants.js";
import { DocumentProcessingStatus, SearchStatus } from "../libs/enums/enums.js";
import {
	formatFileSize,
	mapIntegrationChangesToProposedStructure,
	removeTrackedDocumentId,
} from "../libs/helpers/helpers.js";
import {
	type KnowledgeState,
	type TrackedDocument,
} from "../libs/types/types.js";
import {
	applyIntegrationChanges,
	confirmDocumentUpload,
	fetchExtractionItems,
	fetchIntegrationChanges,
	fetchKnowledgeEntry,
	fetchKnowledgeTree,
	fetchPendingReviewDocuments,
	pollDocumentStatus,
	processDocument,
	retryDocumentProcessing,
	searchKnowledge,
	submitExtractionReview,
	submitManualText,
	updateExtractionItem,
	updateKnowledgeEntry,
} from "./actions.js";
import { clearAllPollTimers } from "./document-poll-timers.js";

type State = KnowledgeState;

const IDLE_DOCUMENT_STATUS = "IDLE" as const;
const NOT_FOUND_INDEX = -1;
const INITIAL_PROGRESS = 15;
const IN_PROGRESS_PERCENTAGE = 50;
const EMPTY_FILES_COUNT = 0;
const FIRST_TRACKED_DOCUMENT_INDEX = 0;

const initialState: State = {
	activeDocumentId: null,
	activeDocumentStatus: IDLE_DOCUMENT_STATUS,
	errorMessage: null,
	extractionItems: [],
	integrationPreviewDocumentId: null,
	integrationPreviewError: null,
	integrationPreviewRequestId: null,
	integrationPreviewSections: [],
	isAddingKnowledge: false,
	isEntryLoading: false,
	isIntegrationPreviewLoading: false,
	isTreeLoading: false,
	pipelineProjectId: null,
	processingStatus: DocumentProcessingStatus.IDLE,
	searchErrorMessage: null,
	searchQuery: "",
	searchResults: [],
	searchStatus: SearchStatus.IDLE,
	selectedEntry: null,
	selectedFiles: [],
	trackedDocuments: [],
	tree: [],
	uploadProjectId: null,
};

const ACTIVE_DOCUMENT_PRIORITY: TrackedDocument["status"][] = [
	DocumentStatus.WAITING_FOR_VALIDATION,
	DocumentStatus.WAITING_FOR_APPROVAL,
	DocumentStatus.FAILED,
];

const IN_FLIGHT_DOCUMENT_STATUSES = new Set<TrackedDocument["status"]>([
	DocumentStatus.EXTRACTED,
	DocumentStatus.EXTRACTING,
	DocumentStatus.INTEGRATING,
	DocumentStatus.PARSED,
	DocumentStatus.PROCESSING,
	DocumentStatus.UPLOADED,
]);

const isCurrentPipelineProject = (state: State, projectId: string): boolean => {
	return state.pipelineProjectId === projectId;
};

const isCurrentUploadProject = (state: State, projectId: string): boolean => {
	return state.uploadProjectId === projectId;
};

const findTrackedDocument = (
	state: State,
	documentId: null | number,
): TrackedDocument | undefined => {
	return state.trackedDocuments.find(
		(document) => document.documentId === documentId,
	);
};

const pickActiveDocument = (state: State): TrackedDocument | undefined => {
	const current = findTrackedDocument(state, state.activeDocumentId);

	if (current && ACTIVE_DOCUMENT_PRIORITY.includes(current.status)) {
		return current;
	}

	for (const status of ACTIVE_DOCUMENT_PRIORITY) {
		const candidate = state.trackedDocuments.find(
			(document) => document.status === status,
		);

		if (candidate) {
			return candidate;
		}
	}

	return current ?? state.trackedDocuments.at(FIRST_TRACKED_DOCUMENT_INDEX);
};

const reconcileActiveDocument = (state: State): void => {
	const nextActive = pickActiveDocument(state);
	const nextActiveId = nextActive?.documentId ?? null;

	if (nextActiveId !== state.activeDocumentId) {
		state.activeDocumentId = nextActiveId;
		state.extractionItems = [];
	}

	state.activeDocumentStatus = nextActive?.status ?? IDLE_DOCUMENT_STATUS;
	state.isAddingKnowledge = state.trackedDocuments.some((document) =>
		IN_FLIGHT_DOCUMENT_STATUSES.has(document.status),
	);
};

const upsertTrackedDocumentStatus = (
	state: State,
	documentId: number,
	status: TrackedDocument["status"],
): void => {
	const existing = findTrackedDocument(state, documentId);

	if (existing) {
		existing.status = status;

		return;
	}

	state.trackedDocuments.push({
		documentId,
		label: `Document ${String(documentId)}`,
		status,
	});
};

const removeTrackedDocument = (
	state: State,
	projectId: string,
	documentId: number,
): void => {
	removeTrackedDocumentId(projectId, documentId);
	state.trackedDocuments = state.trackedDocuments.filter(
		(document) => document.documentId !== documentId,
	);
};

const applyTrackedDocumentStatus = ({
	documentId,
	projectId,
	state,
	status,
}: {
	documentId: number;
	projectId: string;
	state: State;
	status: TrackedDocument["status"];
}): void => {
	if (!isCurrentPipelineProject(state, projectId)) {
		return;
	}

	if (status === DocumentStatus.COMPLETED) {
		removeTrackedDocument(state, projectId, documentId);
	} else {
		upsertTrackedDocumentStatus(state, documentId, status);
	}

	reconcileActiveDocument(state);
};

const { actions, name, reducer } = createSlice({
	extraReducers(builder) {
		builder.addCase(confirmDocumentUpload.pending, (state, action) => {
			if (!isCurrentUploadProject(state, action.meta.arg.projectId)) {
				return;
			}

			state.errorMessage = null;
			state.processingStatus = DocumentProcessingStatus.PROCESSING;
		});
		builder.addCase(confirmDocumentUpload.fulfilled, (state, action) => {
			if (!isCurrentUploadProject(state, action.meta.arg.projectId)) {
				return;
			}

			state.errorMessage = null;
			state.processingStatus = DocumentProcessingStatus.READY;
			reconcileActiveDocument(state);
		});
		builder.addCase(confirmDocumentUpload.rejected, (state, action) => {
			if (!isCurrentUploadProject(state, action.meta.arg.projectId)) {
				return;
			}

			state.errorMessage =
				action.error.message ?? DocumentValidationMessage.PROCESSING_FAILED;
			state.processingStatus = DocumentProcessingStatus.FAILED;
		});
		builder.addCase(processDocument.pending, (state, action) => {
			if (!isCurrentUploadProject(state, action.meta.arg.projectId)) {
				return;
			}

			state.errorMessage = null;
			state.processingStatus = DocumentProcessingStatus.PROCESSING;

			const targetFile = state.selectedFiles.find(
				(file) => file.id === action.meta.arg.id,
			);
			if (targetFile) {
				targetFile.status = DocumentProcessingStatus.PROCESSING;
				targetFile.progress = IN_PROGRESS_PERCENTAGE;
			}
		});
		builder.addCase(processDocument.fulfilled, (state, action) => {
			if (!isCurrentUploadProject(state, action.meta.arg.projectId)) {
				return;
			}

			const targetFileIndex = state.selectedFiles.findIndex(
				(file) => file.id === action.meta.arg.id,
			);

			if (targetFileIndex === NOT_FOUND_INDEX) {
				state.selectedFiles.push(action.payload);
			} else {
				state.selectedFiles[targetFileIndex] = action.payload;
			}

			state.errorMessage = null;

			const hasProcessing = state.selectedFiles.some(
				(file) => file.status === DocumentProcessingStatus.PROCESSING,
			);
			const hasReady = state.selectedFiles.some(
				(file) => file.status === DocumentProcessingStatus.READY,
			);

			if (hasProcessing) {
				state.processingStatus = DocumentProcessingStatus.PROCESSING;
			} else if (hasReady) {
				state.processingStatus = DocumentProcessingStatus.READY;
			} else {
				state.processingStatus = DocumentProcessingStatus.FAILED;
			}
		});
		builder.addCase(processDocument.rejected, (state, action) => {
			if (!isCurrentUploadProject(state, action.meta.arg.projectId)) {
				return;
			}

			const targetFile = state.selectedFiles.find(
				(file) => file.id === action.meta.arg.id,
			);

			if (targetFile) {
				targetFile.status = DocumentProcessingStatus.FAILED;
				targetFile.documentId = action.payload?.documentId;
				targetFile.uploadUrl = action.payload?.uploadUrl;
				targetFile.errorMessage =
					action.payload?.message ??
					DocumentValidationMessage.PROCESSING_FAILED;
			}

			const hasProcessing = state.selectedFiles.some(
				(file) => file.status === DocumentProcessingStatus.PROCESSING,
			);
			const hasReady = state.selectedFiles.some(
				(file) => file.status === DocumentProcessingStatus.READY,
			);

			if (hasProcessing) {
				state.processingStatus = DocumentProcessingStatus.PROCESSING;
				state.errorMessage = null;
			} else if (hasReady) {
				state.processingStatus = DocumentProcessingStatus.READY;
				state.errorMessage = null;
			} else {
				state.processingStatus = DocumentProcessingStatus.FAILED;
				state.errorMessage =
					action.payload?.message ??
					DocumentValidationMessage.PROCESSING_FAILED;
			}
		});
		builder.addCase(fetchIntegrationChanges.pending, (state, action) => {
			state.integrationPreviewDocumentId = action.meta.arg.documentId;
			state.integrationPreviewError = null;
			state.integrationPreviewRequestId = action.meta.requestId;
			state.integrationPreviewSections = [];
			state.isIntegrationPreviewLoading = true;
		});
		builder.addCase(fetchIntegrationChanges.fulfilled, (state, action) => {
			if (state.integrationPreviewRequestId !== action.meta.requestId) {
				return;
			}

			state.integrationPreviewSections =
				mapIntegrationChangesToProposedStructure(action.payload);
			state.integrationPreviewError = null;
			state.isIntegrationPreviewLoading = false;
		});
		builder.addCase(fetchIntegrationChanges.rejected, (state, action) => {
			if (state.integrationPreviewRequestId !== action.meta.requestId) {
				return;
			}

			state.integrationPreviewError =
				typeof action.payload === "string"
					? action.payload
					: (action.error.message ?? "Failed to load integration preview");
			state.integrationPreviewSections = [];
			state.isIntegrationPreviewLoading = false;
		});
		builder.addCase(fetchKnowledgeTree.pending, (state) => {
			state.isTreeLoading = true;
			state.errorMessage = null;
			state.tree = [];
			state.selectedEntry = null;
		});
		builder.addCase(fetchKnowledgeTree.fulfilled, (state, action) => {
			state.isTreeLoading = false;
			state.tree = action.payload.items;
		});
		builder.addCase(fetchKnowledgeTree.rejected, (state, action) => {
			state.isTreeLoading = false;
			state.errorMessage =
				action.error.message ?? "Failed to fetch knowledge tree";
		});
		builder.addCase(fetchKnowledgeEntry.pending, (state) => {
			state.isEntryLoading = true;
			state.errorMessage = null;
		});
		builder.addCase(fetchKnowledgeEntry.fulfilled, (state, action) => {
			state.isEntryLoading = false;
			state.selectedEntry = action.payload;
		});
		builder.addCase(fetchKnowledgeEntry.rejected, (state, action) => {
			state.isEntryLoading = false;
			state.errorMessage =
				action.error.message ?? "Failed to fetch knowledge entry";
		});
		builder.addCase(updateKnowledgeEntry.pending, (state) => {
			state.errorMessage = null;
		});
		builder.addCase(updateKnowledgeEntry.fulfilled, (state, action) => {
			if (state.selectedEntry?.id === action.payload.id) {
				state.selectedEntry = action.payload;
			}

			const treeItem = state.tree.find((item) => item.id === action.payload.id);
			if (treeItem) {
				treeItem.title = action.payload.title;
				treeItem.updatedAt = action.payload.updatedAt;
			}
		});
		builder.addCase(updateKnowledgeEntry.rejected, (state, action) => {
			state.errorMessage =
				action.error.message ?? "Failed to update knowledge entry";
		});
		builder.addCase(searchKnowledge.pending, (state, action) => {
			state.searchErrorMessage = null;
			state.searchQuery = action.meta.arg.query;
			state.searchStatus = SearchStatus.LOADING;
		});
		builder.addCase(searchKnowledge.fulfilled, (state, action) => {
			if (state.searchQuery !== action.meta.arg.query) {
				return;
			}

			state.searchErrorMessage = null;
			state.searchResults = action.payload.items;
			state.searchStatus = SearchStatus.SUCCEEDED;
		});
		builder.addCase(searchKnowledge.rejected, (state, action) => {
			if (state.searchQuery !== action.meta.arg.query) {
				return;
			}

			state.searchErrorMessage =
				action.error.message ?? "Failed to search knowledge base";
			state.searchStatus = SearchStatus.FAILED;
		});
		builder.addCase(submitManualText.fulfilled, (state, action) => {
			if (!isCurrentUploadProject(state, action.meta.arg.projectId)) {
				return;
			}

			state.errorMessage = null;
			reconcileActiveDocument(state);
		});
		builder.addCase(submitManualText.rejected, (state, action) => {
			if (!isCurrentUploadProject(state, action.meta.arg.projectId)) {
				return;
			}

			state.errorMessage = action.error.message ?? "Failed to submit text";
		});
		builder.addCase(pollDocumentStatus.pending, (state, action) => {
			if (isCurrentPipelineProject(state, action.meta.arg.projectId)) {
				state.errorMessage = null;
			}
		});
		builder.addCase(pollDocumentStatus.fulfilled, (state, action) => {
			const { documentId, projectId } = action.meta.arg;

			if (!isCurrentPipelineProject(state, projectId)) {
				return;
			}

			if (state.activeDocumentId === documentId) {
				state.errorMessage = null;
			}

			applyTrackedDocumentStatus({
				documentId,
				projectId,
				state,
				status: action.payload.status,
			});
		});
		builder.addCase(pollDocumentStatus.rejected, (state, action) => {
			const { documentId, projectId } = action.meta.arg;

			if (
				!isCurrentPipelineProject(state, projectId) ||
				state.activeDocumentId !== documentId
			) {
				return;
			}

			state.errorMessage = action.error.message ?? "Failed to poll status";
		});
		builder.addCase(fetchExtractionItems.pending, (state) => {
			state.errorMessage = null;
		});
		builder.addCase(fetchExtractionItems.fulfilled, (state, action) => {
			if (state.activeDocumentId !== action.meta.arg.documentId) {
				return;
			}
			state.extractionItems = action.payload.items;
			state.errorMessage = null;
		});
		builder.addCase(fetchExtractionItems.rejected, (state, action) => {
			if (state.activeDocumentId !== action.meta.arg.documentId) {
				return;
			}

			state.errorMessage =
				action.error.message ?? "Failed to fetch extraction items";
		});
		builder.addCase(updateExtractionItem.fulfilled, (state, action) => {
			const updatedItem = action.payload;
			state.extractionItems = state.extractionItems.map((item) =>
				item.id === updatedItem.id ? updatedItem : item,
			);
		});
		builder.addCase(submitExtractionReview.fulfilled, (state, action) => {
			const { documentId, projectId } = action.meta.arg;

			applyTrackedDocumentStatus({
				documentId,
				projectId,
				state,
				status: action.payload.status,
			});
		});
		builder.addCase(applyIntegrationChanges.fulfilled, (state, action) => {
			const { documentId, projectId } = action.meta.arg;

			applyTrackedDocumentStatus({
				documentId,
				projectId,
				state,
				status: action.payload.status,
			});
		});
		builder.addCase(fetchPendingReviewDocuments.fulfilled, (state, action) => {
			const { projectId } = action.meta.arg;

			if (!isCurrentPipelineProject(state, projectId)) {
				return;
			}

			const pendingIds = new Set(
				action.payload.items.map((document) => document.id),
			);
			const staleDocuments = state.trackedDocuments.filter(
				(document) =>
					(document.status === DocumentStatus.WAITING_FOR_VALIDATION ||
						document.status === DocumentStatus.WAITING_FOR_APPROVAL) &&
					!pendingIds.has(document.documentId),
			);

			for (const document of staleDocuments) {
				removeTrackedDocument(state, projectId, document.documentId);
			}

			for (const document of action.payload.items) {
				const existing = findTrackedDocument(state, document.id);

				if (existing) {
					existing.label = document.name;
					existing.status = document.status;
				} else {
					state.trackedDocuments.push({
						documentId: document.id,
						label: document.name,
						status: document.status,
					});
				}
			}

			reconcileActiveDocument(state);
		});
		builder.addCase(submitExtractionReview.rejected, (state, action) => {
			if (!isCurrentPipelineProject(state, action.meta.arg.projectId)) {
				return;
			}

			state.errorMessage =
				action.error.message ?? "Failed to submit extraction review";
		});
		builder.addCase(retryDocumentProcessing.pending, (state, action) => {
			if (!isCurrentPipelineProject(state, action.meta.arg.projectId)) {
				return;
			}

			state.errorMessage = null;
			applyTrackedDocumentStatus({
				...action.meta.arg,
				state,
				status: DocumentStatus.PROCESSING,
			});
		});
		builder.addCase(retryDocumentProcessing.fulfilled, (state, action) => {
			if (!isCurrentPipelineProject(state, action.meta.arg.projectId)) {
				return;
			}

			state.errorMessage = null;
			applyTrackedDocumentStatus({
				...action.meta.arg,
				state,
				status: action.payload.status,
			});
		});
		builder.addCase(retryDocumentProcessing.rejected, (state, action) => {
			if (!isCurrentPipelineProject(state, action.meta.arg.projectId)) {
				return;
			}

			state.errorMessage = action.error.message ?? "Failed to retry processing";
			applyTrackedDocumentStatus({
				...action.meta.arg,
				state,
				status: DocumentStatus.FAILED,
			});
		});
	},
	initialState,
	name: "knowledge",
	reducers: {
		clearError(state) {
			state.errorMessage = null;
		},
		clearIntegrationPreview(state) {
			state.integrationPreviewDocumentId = null;
			state.integrationPreviewError = null;
			state.integrationPreviewRequestId = null;
			state.integrationPreviewSections = [];
			state.isIntegrationPreviewLoading = false;
		},
		clearSelectedFiles(state) {
			state.errorMessage = null;
			state.processingStatus = DocumentProcessingStatus.IDLE;
			state.selectedFiles = [];
		},
		finishAddingKnowledge(state) {
			state.isAddingKnowledge = false;
		},
		releasePipeline(state) {
			clearAllPollTimers();
			state.pipelineProjectId = null;
		},
		removeDocument(state, action: PayloadAction<{ id: string }>) {
			state.selectedFiles = state.selectedFiles.filter(
				(file) => file.id !== action.payload.id,
			);
			if (state.selectedFiles.length === EMPTY_FILES_COUNT) {
				state.errorMessage = null;
				state.processingStatus = DocumentProcessingStatus.IDLE;
				return;
			}
			const hasProcessing = state.selectedFiles.some(
				(file) => file.status === DocumentProcessingStatus.PROCESSING,
			);
			const hasFailed = state.selectedFiles.some(
				(file) => file.status === DocumentProcessingStatus.FAILED,
			);
			if (hasProcessing) {
				state.processingStatus = DocumentProcessingStatus.PROCESSING;
			} else if (hasFailed) {
				state.processingStatus = DocumentProcessingStatus.FAILED;
			} else {
				state.processingStatus = DocumentProcessingStatus.READY;
			}
		},
		resetState(state, action: PayloadAction<null | string>) {
			clearAllPollTimers();
			state.activeDocumentId = null;
			state.activeDocumentStatus = IDLE_DOCUMENT_STATUS;
			state.errorMessage = null;
			state.extractionItems = [];
			state.integrationPreviewDocumentId = null;
			state.integrationPreviewError = null;
			state.integrationPreviewRequestId = null;
			state.integrationPreviewSections = [];
			state.isAddingKnowledge = false;
			state.isIntegrationPreviewLoading = false;
			state.pipelineProjectId = action.payload;
			state.processingStatus = DocumentProcessingStatus.IDLE;
			state.selectedFiles = [];
			state.trackedDocuments = [];
		},
		setActiveDocumentId(state, action: PayloadAction<number>) {
			if (state.activeDocumentId !== action.payload) {
				state.activeDocumentId = action.payload;
				state.extractionItems = [];
			}

			reconcileActiveDocument(state);
		},
		setError(state, action: PayloadAction<string>) {
			state.errorMessage = action.payload;
			state.processingStatus = DocumentProcessingStatus.FAILED;
		},
		setUploadProject(state, action: PayloadAction<string>) {
			if (state.uploadProjectId === action.payload) {
				return;
			}

			state.uploadProjectId = action.payload;
			state.processingStatus = DocumentProcessingStatus.IDLE;
			state.selectedFiles = [];
		},
		startProcessing(
			state,
			action: PayloadAction<{ id: string; name: string; size: number }>,
		) {
			const { id, name, size } = action.payload;

			state.errorMessage = null;
			state.processingStatus = DocumentProcessingStatus.PROCESSING;

			const existingIndex = state.selectedFiles.findIndex(
				(file) => file.id === id,
			);

			const processingItem = {
				id,
				name,
				progress: INITIAL_PROGRESS,
				size,
				sizeLabel: formatFileSize(size),
				status: DocumentProcessingStatus.PROCESSING,
			};

			if (existingIndex === NOT_FOUND_INDEX) {
				state.selectedFiles.push(processingItem);
			} else {
				state.selectedFiles[existingIndex] = processingItem;
			}
		},
		syncTrackedDocumentStatus(
			state,
			action: PayloadAction<{
				documentId: number;
				projectId: string;
				status: ValueOf<typeof DocumentStatus>;
			}>,
		) {
			applyTrackedDocumentStatus({ ...action.payload, state });
		},
		trackDocument(
			state,
			action: PayloadAction<{
				documentId: number;
				label: string;
				projectId: string;
			}>,
		) {
			const { documentId, label, projectId } = action.payload;

			if (!isCurrentPipelineProject(state, projectId)) {
				return;
			}

			if (!findTrackedDocument(state, documentId)) {
				state.trackedDocuments.push({
					documentId,
					label,
					status: DocumentStatus.UPLOADED,
				});
			}

			reconcileActiveDocument(state);
		},
		untrackDocument(
			state,
			action: PayloadAction<{ documentId: number; projectId: string }>,
		) {
			const { documentId, projectId } = action.payload;

			if (!isCurrentPipelineProject(state, projectId)) {
				return;
			}

			removeTrackedDocument(state, projectId, documentId);
			reconcileActiveDocument(state);
		},
	},
});

export { actions, name, reducer };
