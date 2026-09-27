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
	confirmDocumentUpload,
	fetchExtractionItems,
	fetchIntegrationChanges,
	fetchKnowledgeEntry,
	fetchKnowledgeTree,
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

const initialState: State = {
	activeDocumentId: null,
	activeDocumentStatus: IDLE_DOCUMENT_STATUS,
	errorMessage: null,
	extractionItems: [],
	integrationPreviewError: null,
	integrationPreviewSections: [],
	isAddingKnowledge: false,
	isEntryLoading: false,
	isIntegrationPreviewLoading: false,
	isTreeLoading: false,
	processingStatus: DocumentProcessingStatus.IDLE,
	searchErrorMessage: null,
	searchQuery: "",
	searchResults: [],
	searchStatus: SearchStatus.IDLE,
	selectedEntry: null,
	selectedFiles: [],
	trackedDocuments: [],
	tree: [],
};

const syncActiveDocumentFromTracked = (state: State): void => {
	if (state.activeDocumentId === null) {
		state.activeDocumentStatus = IDLE_DOCUMENT_STATUS;

		return;
	}

	const tracked = state.trackedDocuments.find(
		(document) => document.documentId === state.activeDocumentId,
	);

	state.activeDocumentStatus = tracked?.status ?? IDLE_DOCUMENT_STATUS;
};

const upsertTrackedDocument = (
	state: State,
	document: TrackedDocument,
): void => {
	const existingIndex = state.trackedDocuments.findIndex(
		(entry) => entry.documentId === document.documentId,
	);

	if (existingIndex === NOT_FOUND_INDEX) {
		state.trackedDocuments.push(document);
	} else {
		state.trackedDocuments[existingIndex] = {
			...state.trackedDocuments[existingIndex],
			...document,
		};
	}
};

const INITIAL_PROGRESS = 15;
const IN_PROGRESS_PERCENTAGE = 50;
const EMPTY_FILES_COUNT = 0;
const FIRST_TRACKED_DOCUMENT_INDEX = 0;

const { actions, name, reducer } = createSlice({
	extraReducers(builder) {
		builder.addCase(confirmDocumentUpload.pending, (state) => {
			state.errorMessage = null;
			state.processingStatus = DocumentProcessingStatus.PROCESSING;
		});
		builder.addCase(confirmDocumentUpload.fulfilled, (state, action) => {
			state.errorMessage = null;
			state.processingStatus = DocumentProcessingStatus.READY;

			if (state.activeDocumentId === null) {
				state.activeDocumentId = action.payload.documentId;
			}

			syncActiveDocumentFromTracked(state);
		});
		builder.addCase(confirmDocumentUpload.rejected, (state, action) => {
			state.errorMessage =
				action.error.message ?? DocumentValidationMessage.PROCESSING_FAILED;
			state.processingStatus = DocumentProcessingStatus.FAILED;
		});
		builder.addCase(processDocument.pending, (state, action) => {
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
			const targetFileIndex = state.selectedFiles.findIndex(
				(file) => file.id === action.meta.arg.id,
			);

			if (targetFileIndex === NOT_FOUND_INDEX) {
				state.selectedFiles.push(action.payload);
			} else {
				state.selectedFiles[targetFileIndex] = action.payload;
			}

			state.activeDocumentId =
				action.payload.documentId ?? state.activeDocumentId;
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
		builder.addCase(fetchIntegrationChanges.pending, (state) => {
			state.integrationPreviewError = null;
			state.isIntegrationPreviewLoading = true;
		});
		builder.addCase(fetchIntegrationChanges.fulfilled, (state, action) => {
			state.integrationPreviewSections =
				mapIntegrationChangesToProposedStructure(action.payload);
			state.integrationPreviewError = null;
			state.isIntegrationPreviewLoading = false;
		});
		builder.addCase(fetchIntegrationChanges.rejected, (state, action) => {
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
			state.errorMessage = null;

			if (state.activeDocumentId === null) {
				state.activeDocumentId = action.payload.id;
			}

			syncActiveDocumentFromTracked(state);
		});
		builder.addCase(submitManualText.rejected, (state, action) => {
			state.errorMessage = action.error.message ?? "Failed to submit text";
		});
		builder.addCase(pollDocumentStatus.pending, (state) => {
			state.errorMessage = null;
		});
		builder.addCase(pollDocumentStatus.fulfilled, (state, action) => {
			const { documentId } = action.meta.arg;
			const status = action.payload.status;

			upsertTrackedDocument(state, {
				documentId,
				label:
					state.trackedDocuments.find(
						(document) => document.documentId === documentId,
					)?.label ?? `Document ${String(documentId)}`,
				status,
			});

			if (state.activeDocumentId === documentId) {
				state.activeDocumentStatus = status;
				state.errorMessage = null;
			}

			if (status === DocumentStatus.COMPLETED) {
				state.trackedDocuments = state.trackedDocuments.filter(
					(document) => document.documentId !== documentId,
				);

				if (state.activeDocumentId === documentId) {
					const nextReview = state.trackedDocuments.find(
						(document) =>
							document.status === DocumentStatus.WAITING_FOR_VALIDATION ||
							document.status === DocumentStatus.WAITING_FOR_APPROVAL,
					);

					state.activeDocumentId = nextReview?.documentId ?? null;
					state.extractionItems = [];
					syncActiveDocumentFromTracked(state);

					if (state.trackedDocuments.length === EMPTY_FILES_COUNT) {
						state.isAddingKnowledge = false;
					}
				}
			}
		});
		builder.addCase(pollDocumentStatus.rejected, (state, action) => {
			if (state.activeDocumentId !== action.meta.arg.documentId) {
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
			const { documentId } = action.meta.arg;
			const status = action.payload.status;

			upsertTrackedDocument(state, {
				documentId,
				label:
					state.trackedDocuments.find(
						(document) => document.documentId === documentId,
					)?.label ?? `Document ${String(documentId)}`,
				status,
			});

			if (status === DocumentStatus.COMPLETED) {
				removeTrackedDocumentId(action.meta.arg.projectId, documentId);
				state.trackedDocuments = state.trackedDocuments.filter(
					(document) => document.documentId !== documentId,
				);
				state.extractionItems = [];

				const nextReview = state.trackedDocuments.find(
					(document) =>
						document.status === DocumentStatus.WAITING_FOR_VALIDATION ||
						document.status === DocumentStatus.WAITING_FOR_APPROVAL,
				);

				state.activeDocumentId = nextReview?.documentId ?? null;
				syncActiveDocumentFromTracked(state);

				if (state.trackedDocuments.length === EMPTY_FILES_COUNT) {
					state.isAddingKnowledge = false;
				}
			} else if (state.activeDocumentId === documentId) {
				state.activeDocumentStatus = status;
			}
		});
		builder.addCase(submitExtractionReview.rejected, (state, action) => {
			state.errorMessage =
				action.error.message ?? "Failed to submit extraction review";
		});
		builder.addCase(retryDocumentProcessing.pending, (state) => {
			state.errorMessage = null;
			state.activeDocumentStatus = DocumentStatus.PROCESSING;
		});
		builder.addCase(retryDocumentProcessing.fulfilled, (state, action) => {
			state.errorMessage = null;
			state.activeDocumentStatus = action.payload.status;
		});
		builder.addCase(retryDocumentProcessing.rejected, (state, action) => {
			state.errorMessage = action.error.message ?? "Failed to retry processing";
			state.activeDocumentStatus = DocumentStatus.FAILED;
		});
	},
	initialState,
	name: "knowledge",
	reducers: {
		cancelDocumentPolling() {
			clearAllPollTimers();
		},
		clearError(state) {
			state.errorMessage = null;
		},
		clearIntegrationPreview(state) {
			state.integrationPreviewError = null;
			state.integrationPreviewSections = [];
			state.isIntegrationPreviewLoading = false;
		},
		finishAddingKnowledge(state) {
			state.isAddingKnowledge = false;
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
		resetState(state) {
			clearAllPollTimers();
			state.activeDocumentId = null;
			state.activeDocumentStatus = IDLE_DOCUMENT_STATUS;
			state.errorMessage = null;
			state.extractionItems = [];
			state.integrationPreviewError = null;
			state.integrationPreviewSections = [];
			state.isAddingKnowledge = false;
			state.isIntegrationPreviewLoading = false;
			state.processingStatus = DocumentProcessingStatus.IDLE;
			state.selectedFiles = [];
			state.trackedDocuments = [];
		},
		setActiveDocumentId(state, action: PayloadAction<null | number>) {
			state.activeDocumentId = action.payload;
		},
		setError(state, action: PayloadAction<string>) {
			state.errorMessage = action.payload;
			state.processingStatus = DocumentProcessingStatus.FAILED;
		},
		startAddingKnowledge(state) {
			state.isAddingKnowledge = true;
		},
		startAddingKnowledgeFromHydration(state) {
			if (state.trackedDocuments.length === EMPTY_FILES_COUNT) {
				return;
			}

			state.isAddingKnowledge = true;

			const preferredDocument =
				state.trackedDocuments.find(
					(document) =>
						document.status === DocumentStatus.WAITING_FOR_VALIDATION,
				) ??
				state.trackedDocuments.find(
					(document) => document.status === DocumentStatus.WAITING_FOR_APPROVAL,
				) ??
				state.trackedDocuments[FIRST_TRACKED_DOCUMENT_INDEX];

			if (preferredDocument && state.activeDocumentId === null) {
				state.activeDocumentId = preferredDocument.documentId;
				syncActiveDocumentFromTracked(state);
			}
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
				status: ValueOf<typeof DocumentStatus>;
			}>,
		) {
			const { documentId, status } = action.payload;

			upsertTrackedDocument(state, {
				documentId,
				label:
					state.trackedDocuments.find(
						(document) => document.documentId === documentId,
					)?.label ?? `Document ${String(documentId)}`,
				status,
			});

			if (state.activeDocumentId === documentId) {
				state.activeDocumentStatus = status;
			}
		},
		trackDocument(
			state,
			action: PayloadAction<{ documentId: number; label: string }>,
		) {
			const { documentId, label } = action.payload;

			upsertTrackedDocument(state, {
				documentId,
				label,
				status: DocumentStatus.UPLOADED,
			});

			if (state.activeDocumentId === null) {
				state.activeDocumentId = documentId;
				state.activeDocumentStatus = DocumentStatus.UPLOADED;
			}
		},
	},
});

export { actions, name, reducer };
