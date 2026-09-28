import { DocumentStatus } from "@knowledgeprism/constants";
import { type DocumentStatusResponseDto } from "@knowledgeprism/types";
import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

import { type ValueOf } from "~/lib/types/types.js";

import { DocumentValidationMessage } from "../libs/constants/constants.js";
import { DocumentProcessingStatus, SearchStatus } from "../libs/enums/enums.js";
import {
	formatFileSize,
	isMatchingPipelineSession,
	mapIntegrationChangesToProposedStructure,
} from "../libs/helpers/helpers.js";
import {
	type KnowledgeState,
	type PipelineSessionScope,
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
	switchActiveDocument,
	updateExtractionItem,
	updateKnowledgeEntry,
} from "./actions.js";
import { clearAllPollTimers, clearPollTimer } from "./document-poll-timers.js";

type State = KnowledgeState;

const IDLE_DOCUMENT_STATUS = "IDLE" as const;
const NOT_FOUND_INDEX = -1;
const INITIAL_PROGRESS = 15;
const IN_PROGRESS_PERCENTAGE = 50;
const EMPTY_FILES_COUNT = 0;
const FIRST_TRACKED_DOCUMENT_INDEX = 0;
const SESSION_COUNTER_STEP = 1;
const TREE_REVISION_STEP = 1;

const initialState: State = {
	activeDocumentId: null,
	activeDocumentStatus: IDLE_DOCUMENT_STATUS,
	activeDocumentSwitchRequestId: null,
	entryRequestId: null,
	extractionItems: [],
	extractionItemsDocumentId: null,
	integrationPreviewDocumentId: null,
	integrationPreviewError: null,
	integrationPreviewRequestId: null,
	integrationPreviewSections: [],
	isAddingKnowledge: false,
	isEntryLoading: false,
	isIntegrationPreviewLoading: false,
	isTreeLoading: false,
	knowledgeErrorMessage: null,
	pendingReviewRequestId: null,
	pipelineErrors: {},
	pipelineProjectId: null,
	pipelineSessionId: 0,
	processingStatus: DocumentProcessingStatus.IDLE,
	searchErrorMessage: null,
	searchQuery: "",
	searchRequestId: null,
	searchResults: [],
	searchStatus: SearchStatus.IDLE,
	selectedEntry: null,
	selectedFiles: [],
	statusRequestIds: {},
	trackedDocuments: [],
	tree: [],
	treeRequestId: null,
	treeRevision: 0,
	updateEntryRequestIds: {},
	uploadErrorMessage: null,
	uploadSession: null,
	uploadSessionSequence: 0,
};

const ACTIVE_DOCUMENT_PRIORITY: TrackedDocument["status"][] = [
	DocumentStatus.WAITING_FOR_VALIDATION,
	DocumentStatus.WAITING_FOR_APPROVAL,
	DocumentStatus.FAILED,
];

const FINISHED_DOCUMENT_STATUSES = new Set<TrackedDocument["status"]>([
	DocumentStatus.CANCELLED,
	DocumentStatus.COMPLETED,
]);

const IN_FLIGHT_DOCUMENT_STATUSES = new Set<TrackedDocument["status"]>([
	DocumentStatus.APPROVED,
	DocumentStatus.EXTRACTED,
	DocumentStatus.EXTRACTING,
	DocumentStatus.INTEGRATING,
	DocumentStatus.PARSED,
	DocumentStatus.PROCESSING,
	DocumentStatus.UPLOADED,
	DocumentStatus.VALIDATED,
]);

const isCurrentPipelineProject = (state: State, projectId: string): boolean => {
	return state.pipelineProjectId === projectId;
};

const isCurrentPipelineSession = (
	state: State,
	scope: PipelineSessionScope,
): boolean => {
	return isMatchingPipelineSession(state, scope);
};

const isCurrentUploadSession = (
	state: State,
	uploadSessionId: number,
): boolean => {
	return state.uploadSession?.id === uploadSessionId;
};

const findTrackedDocument = (
	state: State,
	documentId: null | number,
): TrackedDocument | undefined => {
	return state.trackedDocuments.find(
		(document) => document.documentId === documentId,
	);
};

const clearDocumentPipelineError = (state: State, documentId: number): void => {
	state.pipelineErrors = Object.fromEntries(
		Object.entries(state.pipelineErrors).filter(
			([storedDocumentId]) => Number(storedDocumentId) !== documentId,
		),
	);
};

const setPipelineError = (
	state: State,
	documentId: number,
	message: string,
): void => {
	state.pipelineErrors[documentId] = message;
};

const clearEntryUpdateRequest = (state: State, entryId: number): void => {
	state.updateEntryRequestIds = Object.fromEntries(
		Object.entries(state.updateEntryRequestIds).filter(
			([storedEntryId]) => Number(storedEntryId) !== entryId,
		),
	);
};

const clearDocumentStatusRequest = (state: State, documentId: number): void => {
	state.statusRequestIds = Object.fromEntries(
		Object.entries(state.statusRequestIds).filter(
			([storedDocumentId]) => Number(storedDocumentId) !== documentId,
		),
	);
};

const invalidateDocumentStatusPolling = (
	state: State,
	documentId: number,
): void => {
	clearPollTimer(documentId);
	clearDocumentStatusRequest(state, documentId);
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
		state.extractionItemsDocumentId = null;
	}

	state.activeDocumentStatus = nextActive?.status ?? IDLE_DOCUMENT_STATUS;

	if (state.activeDocumentStatus !== DocumentStatus.WAITING_FOR_VALIDATION) {
		state.extractionItems = [];
		state.extractionItemsDocumentId = null;
	}

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

const removeTrackedDocument = (state: State, documentId: number): void => {
	clearPollTimer(documentId);
	clearDocumentPipelineError(state, documentId);
	clearDocumentStatusRequest(state, documentId);
	state.trackedDocuments = state.trackedDocuments.filter(
		(document) => document.documentId !== documentId,
	);

	if (state.extractionItemsDocumentId === documentId) {
		state.extractionItems = [];
		state.extractionItemsDocumentId = null;
	}
};

const applyTrackedDocumentStatus = ({
	documentId,
	pipelineSessionId,
	projectId,
	state,
	status,
}: PipelineSessionScope & {
	documentId: number;
	state: State;
	status: TrackedDocument["status"];
}): void => {
	if (!isCurrentPipelineSession(state, { pipelineSessionId, projectId })) {
		return;
	}

	if (!findTrackedDocument(state, documentId)) {
		return;
	}

	clearDocumentStatusRequest(state, documentId);

	if (FINISHED_DOCUMENT_STATUSES.has(status)) {
		removeTrackedDocument(state, documentId);
	} else {
		upsertTrackedDocumentStatus(state, documentId, status);
	}

	reconcileActiveDocument(state);
};

const { actions, name, reducer } = createSlice({
	extraReducers(builder) {
		builder.addCase(confirmDocumentUpload.pending, (state, action) => {
			if (!isCurrentUploadSession(state, action.meta.arg.uploadSessionId)) {
				return;
			}

			state.uploadErrorMessage = null;
			state.processingStatus = DocumentProcessingStatus.PROCESSING;
		});
		builder.addCase(confirmDocumentUpload.fulfilled, (state, action) => {
			if (!isCurrentUploadSession(state, action.meta.arg.uploadSessionId)) {
				return;
			}

			state.uploadErrorMessage = null;
			state.processingStatus = DocumentProcessingStatus.READY;
			reconcileActiveDocument(state);
		});
		builder.addCase(confirmDocumentUpload.rejected, (state, action) => {
			if (!isCurrentUploadSession(state, action.meta.arg.uploadSessionId)) {
				return;
			}

			state.uploadErrorMessage =
				action.error.message ?? DocumentValidationMessage.PROCESSING_FAILED;
			state.processingStatus = DocumentProcessingStatus.FAILED;
		});
		builder.addCase(processDocument.pending, (state, action) => {
			if (!isCurrentUploadSession(state, action.meta.arg.uploadSessionId)) {
				return;
			}

			state.uploadErrorMessage = null;
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
			if (!isCurrentUploadSession(state, action.meta.arg.uploadSessionId)) {
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

			state.uploadErrorMessage = null;

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
			if (!isCurrentUploadSession(state, action.meta.arg.uploadSessionId)) {
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
				state.uploadErrorMessage = null;
			} else if (hasReady) {
				state.processingStatus = DocumentProcessingStatus.READY;
				state.uploadErrorMessage = null;
			} else {
				state.processingStatus = DocumentProcessingStatus.FAILED;
				state.uploadErrorMessage =
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
		builder.addCase(fetchKnowledgeTree.pending, (state, action) => {
			state.isTreeLoading = true;
			state.knowledgeErrorMessage = null;
			state.tree = [];
			state.treeRequestId = action.meta.requestId;
			state.selectedEntry = null;
		});
		builder.addCase(fetchKnowledgeTree.fulfilled, (state, action) => {
			if (state.treeRequestId !== action.meta.requestId) {
				return;
			}

			state.isTreeLoading = false;
			state.tree = action.payload.items;
			state.treeRequestId = null;
			state.treeRevision += TREE_REVISION_STEP;
		});
		builder.addCase(fetchKnowledgeTree.rejected, (state, action) => {
			if (state.treeRequestId !== action.meta.requestId) {
				return;
			}

			state.isTreeLoading = false;
			state.treeRequestId = null;
			state.knowledgeErrorMessage =
				action.error.message ?? "Failed to fetch knowledge tree";
		});
		builder.addCase(fetchKnowledgeEntry.pending, (state, action) => {
			state.entryRequestId = action.meta.requestId;
			state.isEntryLoading = true;
			state.knowledgeErrorMessage = null;
		});
		builder.addCase(fetchKnowledgeEntry.fulfilled, (state, action) => {
			if (state.entryRequestId !== action.meta.requestId) {
				return;
			}

			state.entryRequestId = null;
			state.isEntryLoading = false;
			state.knowledgeErrorMessage = null;
			state.selectedEntry = action.payload;
		});
		builder.addCase(fetchKnowledgeEntry.rejected, (state, action) => {
			if (state.entryRequestId !== action.meta.requestId) {
				return;
			}

			state.entryRequestId = null;
			state.isEntryLoading = false;
			if (action.meta.aborted) {
				return;
			}

			state.knowledgeErrorMessage =
				action.error.message ?? "Failed to fetch knowledge entry";
		});
		builder.addCase(updateKnowledgeEntry.pending, (state, action) => {
			state.updateEntryRequestIds[action.meta.arg.entryId] =
				action.meta.requestId;
			state.knowledgeErrorMessage = null;
		});
		builder.addCase(updateKnowledgeEntry.fulfilled, (state, action) => {
			if (
				state.updateEntryRequestIds[action.meta.arg.entryId] !==
				action.meta.requestId
			) {
				return;
			}

			clearEntryUpdateRequest(state, action.meta.arg.entryId);
			if (state.selectedEntry?.id === action.payload.id) {
				state.knowledgeErrorMessage = null;
				state.selectedEntry = action.payload;
			}

			const treeItem = state.tree.find((item) => item.id === action.payload.id);
			if (treeItem) {
				treeItem.title = action.payload.title;
				treeItem.updatedAt = action.payload.updatedAt;
			}
		});
		builder.addCase(updateKnowledgeEntry.rejected, (state, action) => {
			if (
				state.updateEntryRequestIds[action.meta.arg.entryId] !==
				action.meta.requestId
			) {
				return;
			}

			clearEntryUpdateRequest(state, action.meta.arg.entryId);
			if (action.meta.aborted) {
				return;
			}

			if (state.selectedEntry?.id === action.meta.arg.entryId) {
				state.knowledgeErrorMessage =
					action.error.message ?? "Failed to update knowledge entry";
			}
		});
		builder.addCase(searchKnowledge.pending, (state, action) => {
			state.searchErrorMessage = null;
			state.searchQuery = action.meta.arg.query;
			state.searchRequestId = action.meta.requestId;
			state.searchStatus = SearchStatus.LOADING;
		});
		builder.addCase(searchKnowledge.fulfilled, (state, action) => {
			if (state.searchRequestId !== action.meta.requestId) {
				return;
			}

			state.searchErrorMessage = null;
			state.searchRequestId = null;
			state.searchResults = action.payload.items;
			state.searchStatus = SearchStatus.SUCCEEDED;
		});
		builder.addCase(searchKnowledge.rejected, (state, action) => {
			if (state.searchRequestId !== action.meta.requestId) {
				return;
			}

			state.searchRequestId = null;
			if (action.meta.aborted) {
				state.searchStatus = SearchStatus.IDLE;

				return;
			}

			state.searchErrorMessage =
				action.error.message ?? "Failed to search knowledge base";
			state.searchStatus = SearchStatus.FAILED;
		});
		builder.addCase(submitManualText.fulfilled, (state, action) => {
			if (!isCurrentUploadSession(state, action.meta.arg.uploadSessionId)) {
				return;
			}

			state.uploadErrorMessage = null;
			reconcileActiveDocument(state);
		});
		builder.addCase(submitManualText.rejected, (state, action) => {
			if (!isCurrentUploadSession(state, action.meta.arg.uploadSessionId)) {
				return;
			}

			state.uploadErrorMessage =
				action.error.message ?? "Failed to submit text";
		});
		builder.addCase(pollDocumentStatus.pending, (state, action) => {
			if (
				!isCurrentPipelineSession(state, action.meta.arg) ||
				!findTrackedDocument(state, action.meta.arg.documentId)
			) {
				return;
			}

			state.statusRequestIds[action.meta.arg.documentId] =
				action.meta.requestId;
		});
		builder.addCase(pollDocumentStatus.fulfilled, (state, action) => {
			if (
				!isCurrentPipelineSession(state, action.meta.arg) ||
				!findTrackedDocument(state, action.meta.arg.documentId) ||
				state.statusRequestIds[action.meta.arg.documentId] !==
					action.meta.requestId
			) {
				return;
			}

			clearDocumentPipelineError(state, action.meta.arg.documentId);

			applyTrackedDocumentStatus({
				...action.meta.arg,
				state,
				status: action.payload.status,
			});
		});
		builder.addCase(pollDocumentStatus.rejected, (state, action) => {
			if (
				!isCurrentPipelineSession(state, action.meta.arg) ||
				!findTrackedDocument(state, action.meta.arg.documentId) ||
				state.statusRequestIds[action.meta.arg.documentId] !==
					action.meta.requestId
			) {
				return;
			}

			clearDocumentStatusRequest(state, action.meta.arg.documentId);
			setPipelineError(
				state,
				action.meta.arg.documentId,
				action.error.message ?? "Failed to poll status",
			);
		});
		builder.addCase(fetchExtractionItems.pending, (state, action) => {
			if (
				!isCurrentPipelineSession(state, action.meta.arg) ||
				state.activeDocumentId !== action.meta.arg.documentId ||
				!findTrackedDocument(state, action.meta.arg.documentId)
			) {
				return;
			}

			clearDocumentPipelineError(state, action.meta.arg.documentId);
			state.extractionItems = [];
			state.extractionItemsDocumentId = null;
		});
		builder.addCase(fetchExtractionItems.fulfilled, (state, action) => {
			const document = findTrackedDocument(state, action.meta.arg.documentId);

			if (
				!isCurrentPipelineSession(state, action.meta.arg) ||
				state.activeDocumentId !== action.meta.arg.documentId ||
				document?.status !== DocumentStatus.WAITING_FOR_VALIDATION
			) {
				return;
			}

			state.extractionItems = action.payload.items;
			state.extractionItemsDocumentId = action.meta.arg.documentId;
			clearDocumentPipelineError(state, action.meta.arg.documentId);
		});
		builder.addCase(fetchExtractionItems.rejected, (state, action) => {
			const document = findTrackedDocument(state, action.meta.arg.documentId);

			if (
				!isCurrentPipelineSession(state, action.meta.arg) ||
				state.activeDocumentId !== action.meta.arg.documentId ||
				document?.status !== DocumentStatus.WAITING_FOR_VALIDATION
			) {
				return;
			}

			setPipelineError(
				state,
				action.meta.arg.documentId,
				action.error.message ?? "Failed to fetch extraction items",
			);
		});
		builder.addCase(updateExtractionItem.pending, (state, action) => {
			if (isCurrentPipelineSession(state, action.meta.arg)) {
				clearDocumentPipelineError(state, action.meta.arg.documentId);
			}
		});
		builder.addCase(updateExtractionItem.fulfilled, (state, action) => {
			const document = findTrackedDocument(state, action.meta.arg.documentId);

			if (
				!isCurrentPipelineSession(state, action.meta.arg) ||
				state.activeDocumentId !== action.meta.arg.documentId ||
				state.extractionItemsDocumentId !== action.meta.arg.documentId ||
				document?.status !== DocumentStatus.WAITING_FOR_VALIDATION
			) {
				return;
			}

			const updatedItem = action.payload;
			state.extractionItems = state.extractionItems.map((item) =>
				item.id === updatedItem.id ? updatedItem : item,
			);
			clearDocumentPipelineError(state, action.meta.arg.documentId);
		});
		builder.addCase(updateExtractionItem.rejected, (state, action) => {
			const document = findTrackedDocument(state, action.meta.arg.documentId);

			if (
				!isCurrentPipelineSession(state, action.meta.arg) ||
				document?.status !== DocumentStatus.WAITING_FOR_VALIDATION
			) {
				return;
			}

			setPipelineError(
				state,
				action.meta.arg.documentId,
				action.error.message ?? "Failed to update extraction item",
			);
		});
		builder.addCase(submitExtractionReview.pending, (state, action) => {
			if (!isCurrentPipelineSession(state, action.meta.arg)) {
				return;
			}

			invalidateDocumentStatusPolling(state, action.meta.arg.documentId);
			clearDocumentPipelineError(state, action.meta.arg.documentId);
		});
		builder.addCase(submitExtractionReview.fulfilled, (state, action) => {
			if (
				!isCurrentPipelineSession(state, action.meta.arg) ||
				!findTrackedDocument(state, action.meta.arg.documentId)
			) {
				return;
			}

			clearDocumentPipelineError(state, action.meta.arg.documentId);
			applyTrackedDocumentStatus({
				...action.meta.arg,
				state,
				status: action.payload.status,
			});
		});
		builder.addCase(applyIntegrationChanges.pending, (state, action) => {
			if (isCurrentPipelineSession(state, action.meta.arg)) {
				invalidateDocumentStatusPolling(state, action.meta.arg.documentId);
			}
		});
		builder.addCase(applyIntegrationChanges.fulfilled, (state, action) => {
			if (
				!isCurrentPipelineSession(state, action.meta.arg) ||
				!findTrackedDocument(state, action.meta.arg.documentId)
			) {
				return;
			}

			if (state.integrationPreviewDocumentId === action.meta.arg.documentId) {
				state.integrationPreviewError = null;
			}
			clearDocumentPipelineError(state, action.meta.arg.documentId);
			applyTrackedDocumentStatus({
				...action.meta.arg,
				state,
				status: action.payload.status,
			});
		});
		builder.addCase(fetchPendingReviewDocuments.pending, (state, action) => {
			if (isCurrentPipelineSession(state, action.meta.arg)) {
				state.pendingReviewRequestId = action.meta.requestId;
			}
		});
		builder.addCase(fetchPendingReviewDocuments.fulfilled, (state, action) => {
			if (
				!isCurrentPipelineSession(state, action.meta.arg) ||
				state.pendingReviewRequestId !== action.meta.requestId
			) {
				return;
			}

			state.pendingReviewRequestId = null;
		});
		builder.addCase(fetchPendingReviewDocuments.rejected, (state, action) => {
			if (state.pendingReviewRequestId === action.meta.requestId) {
				state.pendingReviewRequestId = null;
			}
		});
		builder.addCase(submitExtractionReview.rejected, (state, action) => {
			const document = findTrackedDocument(state, action.meta.arg.documentId);

			if (
				!isCurrentPipelineSession(state, action.meta.arg) ||
				document?.status !== DocumentStatus.WAITING_FOR_VALIDATION
			) {
				return;
			}

			setPipelineError(
				state,
				action.meta.arg.documentId,
				action.error.message ?? "Failed to submit extraction review",
			);
		});
		builder.addCase(applyIntegrationChanges.rejected, (state, action) => {
			const document = findTrackedDocument(state, action.meta.arg.documentId);

			if (
				!isCurrentPipelineSession(state, action.meta.arg) ||
				document?.status !== DocumentStatus.WAITING_FOR_APPROVAL
			) {
				return;
			}

			const message =
				action.error.message ?? "Failed to apply integration changes";
			if (state.integrationPreviewDocumentId === action.meta.arg.documentId) {
				state.integrationPreviewError = message;
			}
			setPipelineError(state, action.meta.arg.documentId, message);
		});
		builder.addCase(retryDocumentProcessing.pending, (state, action) => {
			if (!isCurrentPipelineSession(state, action.meta.arg)) {
				return;
			}

			invalidateDocumentStatusPolling(state, action.meta.arg.documentId);
			clearDocumentPipelineError(state, action.meta.arg.documentId);
		});
		builder.addCase(retryDocumentProcessing.fulfilled, (state, action) => {
			if (!isCurrentPipelineSession(state, action.meta.arg)) {
				return;
			}

			clearDocumentPipelineError(state, action.meta.arg.documentId);
			applyTrackedDocumentStatus({
				...action.meta.arg,
				state,
				status: action.payload.status,
			});
		});
		builder.addCase(retryDocumentProcessing.rejected, (state, action) => {
			const document = findTrackedDocument(state, action.meta.arg.documentId);

			if (
				!isCurrentPipelineSession(state, action.meta.arg) ||
				document?.status !== DocumentStatus.FAILED
			) {
				return;
			}

			setPipelineError(
				state,
				action.meta.arg.documentId,
				action.error.message ?? "Failed to retry processing",
			);
		});
		builder.addCase(switchActiveDocument.pending, (state, action) => {
			if (
				!isCurrentPipelineSession(state, action.meta.arg) ||
				!findTrackedDocument(state, action.meta.arg.documentId)
			) {
				return;
			}

			state.activeDocumentSwitchRequestId = action.meta.requestId;
			invalidateDocumentStatusPolling(state, action.meta.arg.documentId);
		});
		builder.addCase(switchActiveDocument.fulfilled, (state, action) => {
			if (state.activeDocumentSwitchRequestId === action.meta.requestId) {
				state.activeDocumentSwitchRequestId = null;
			}
		});
		builder.addCase(switchActiveDocument.rejected, (state, action) => {
			if (
				!isCurrentPipelineSession(state, action.meta.arg) ||
				!findTrackedDocument(state, action.meta.arg.documentId) ||
				state.activeDocumentSwitchRequestId !== action.meta.requestId
			) {
				return;
			}

			state.activeDocumentSwitchRequestId = null;
			setPipelineError(
				state,
				action.meta.arg.documentId,
				action.error.message ?? "Failed to switch review document",
			);
		});
	},
	initialState,
	name: "knowledge",
	reducers: {
		acquireUploadSession(state, action: PayloadAction<string>) {
			if (state.uploadSession?.projectId === action.payload) {
				state.uploadSession.subscriberCount += SESSION_COUNTER_STEP;

				return;
			}

			state.uploadSessionSequence += SESSION_COUNTER_STEP;
			state.uploadSession = {
				id: state.uploadSessionSequence,
				projectId: action.payload,
				subscriberCount: SESSION_COUNTER_STEP,
			};
			state.processingStatus = DocumentProcessingStatus.IDLE;
			state.selectedFiles = [];
			state.uploadErrorMessage = null;
		},
		activatePreparedReviewDocument(
			state,
			action: PayloadAction<
				PipelineSessionScope & {
					documentId: number;
					extractionItems: KnowledgeState["extractionItems"];
					status:
						| typeof DocumentStatus.WAITING_FOR_APPROVAL
						| typeof DocumentStatus.WAITING_FOR_VALIDATION;
					switchRequestId: string;
				}
			>,
		) {
			const { documentId, extractionItems, status, switchRequestId } =
				action.payload;

			if (
				!isCurrentPipelineSession(state, action.payload) ||
				!findTrackedDocument(state, documentId) ||
				state.activeDocumentSwitchRequestId !== switchRequestId
			) {
				return;
			}

			upsertTrackedDocumentStatus(state, documentId, status);
			state.activeDocumentId = documentId;
			state.activeDocumentStatus = status;
			state.extractionItems = extractionItems;
			state.extractionItemsDocumentId =
				status === DocumentStatus.WAITING_FOR_VALIDATION ? documentId : null;
			clearDocumentPipelineError(state, documentId);
			reconcileActiveDocument(state);
		},
		clearIntegrationPreview(state) {
			state.integrationPreviewDocumentId = null;
			state.integrationPreviewError = null;
			state.integrationPreviewRequestId = null;
			state.integrationPreviewSections = [];
			state.isIntegrationPreviewLoading = false;
		},
		clearKnowledgeError(state) {
			state.knowledgeErrorMessage = null;
		},
		clearPipelineError(
			state,
			action: PayloadAction<{ documentId: number; projectId: string }>,
		) {
			if (isCurrentPipelineProject(state, action.payload.projectId)) {
				clearDocumentPipelineError(state, action.payload.documentId);
			}
		},
		clearSelectedFiles(state) {
			state.uploadErrorMessage = null;
			state.processingStatus = DocumentProcessingStatus.IDLE;
			state.selectedFiles = [];
		},
		clearUploadError(state) {
			state.uploadErrorMessage = null;
		},
		reconcilePendingReviewDocuments(
			state,
			action: PayloadAction<
				PipelineSessionScope & {
					discoveredDocuments: DocumentStatusResponseDto[];
					labels: { documentId: number; label: string }[];
					requestId: string;
					trackedDocumentIdsAtStart: number[];
				}
			>,
		) {
			if (
				!isCurrentPipelineSession(state, action.payload) ||
				state.pendingReviewRequestId !== action.payload.requestId
			) {
				return;
			}

			for (const { documentId, label } of action.payload.labels) {
				const existing = findTrackedDocument(state, documentId);

				if (existing) {
					existing.label = label;
				}
			}

			const trackedDocumentIdsAtStart = new Set(
				action.payload.trackedDocumentIdsAtStart,
			);

			for (const document of action.payload.discoveredDocuments) {
				if (
					findTrackedDocument(state, document.id) ||
					trackedDocumentIdsAtStart.has(document.id) ||
					FINISHED_DOCUMENT_STATUSES.has(document.status)
				) {
					continue;
				}

				state.trackedDocuments.push({
					documentId: document.id,
					label: document.name,
					status: document.status,
				});
			}

			reconcileActiveDocument(state);
		},
		releasePipeline(state) {
			clearAllPollTimers();
			state.activeDocumentSwitchRequestId = null;
			state.entryRequestId = null;
			state.isEntryLoading = false;
			state.isTreeLoading = false;
			state.pendingReviewRequestId = null;
			state.pipelineProjectId = null;
			state.pipelineSessionId += SESSION_COUNTER_STEP;
			state.searchRequestId = null;
			state.statusRequestIds = {};
			state.treeRequestId = null;
			state.updateEntryRequestIds = {};
		},
		releaseUploadSession(state, action: PayloadAction<string>) {
			if (state.uploadSession?.projectId !== action.payload) {
				return;
			}

			state.uploadSession.subscriberCount -= SESSION_COUNTER_STEP;

			if (state.uploadSession.subscriberCount > EMPTY_FILES_COUNT) {
				return;
			}

			state.uploadSession = null;
			state.processingStatus = DocumentProcessingStatus.IDLE;
			state.selectedFiles = [];
			state.uploadErrorMessage = null;
		},
		removeDocument(state, action: PayloadAction<{ id: string }>) {
			state.selectedFiles = state.selectedFiles.filter(
				(file) => file.id !== action.payload.id,
			);
			if (state.selectedFiles.length === EMPTY_FILES_COUNT) {
				state.uploadErrorMessage = null;
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
			state.activeDocumentSwitchRequestId = null;
			state.entryRequestId = null;
			state.extractionItems = [];
			state.extractionItemsDocumentId = null;
			state.integrationPreviewDocumentId = null;
			state.integrationPreviewError = null;
			state.integrationPreviewRequestId = null;
			state.integrationPreviewSections = [];
			state.isAddingKnowledge = false;
			state.isEntryLoading = false;
			state.isIntegrationPreviewLoading = false;
			state.isTreeLoading = false;
			state.knowledgeErrorMessage = null;
			state.pendingReviewRequestId = null;
			state.pipelineErrors = {};
			state.pipelineProjectId = action.payload;
			state.pipelineSessionId += SESSION_COUNTER_STEP;
			state.processingStatus = DocumentProcessingStatus.IDLE;
			state.searchErrorMessage = null;
			state.searchQuery = "";
			state.searchRequestId = null;
			state.searchResults = [];
			state.searchStatus = SearchStatus.IDLE;
			state.selectedFiles = [];
			state.selectedEntry = null;
			state.statusRequestIds = {};
			state.trackedDocuments = [];
			state.tree = [];
			state.treeRequestId = null;
			state.treeRevision = 0;
			state.updateEntryRequestIds = {};
		},
		setUploadError(state, action: PayloadAction<string>) {
			state.uploadErrorMessage = action.payload;
			state.processingStatus = DocumentProcessingStatus.FAILED;
		},
		startProcessing(
			state,
			action: PayloadAction<{ id: string; name: string; size: number }>,
		) {
			const { id, name, size } = action.payload;

			state.uploadErrorMessage = null;
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
			action: PayloadAction<
				PipelineSessionScope & {
					documentId: number;
					status: ValueOf<typeof DocumentStatus>;
				}
			>,
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
		untrackDocumentState(
			state,
			action: PayloadAction<{ documentId: number; projectId: string }>,
		) {
			const { documentId, projectId } = action.payload;

			if (!isCurrentPipelineProject(state, projectId)) {
				return;
			}

			removeTrackedDocument(state, documentId);
			reconcileActiveDocument(state);
		},
	},
});

export { actions, name, reducer };
