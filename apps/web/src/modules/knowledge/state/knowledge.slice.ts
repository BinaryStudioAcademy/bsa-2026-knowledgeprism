import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

import { DocumentValidationMessage } from "../libs/constants/constants.js";
import { DocumentProcessingStatus, SearchStatus } from "../libs/enums/enums.js";
import {
	formatFileSize,
	mapIntegrationChangesToProposedStructure,
} from "../libs/helpers/helpers.js";
import { type KnowledgeState } from "../libs/types/types.js";
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
	updateKnowledgeEntry,
} from "./actions.js";

type State = KnowledgeState;

const initialState: State = {
	activeDocumentId: null,
	activeDocumentStatus: "IDLE",
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
	tree: [],
};

const INITIAL_PROGRESS = 15;
const IN_PROGRESS_PERCENTAGE = 50;
const NOT_FOUND_INDEX = -1;
const EMPTY_FILES_COUNT = 0;

const { actions, name, reducer } = createSlice({
	extraReducers(builder) {
		builder.addCase(confirmDocumentUpload.pending, (state) => {
			state.errorMessage = null;
			state.processingStatus = DocumentProcessingStatus.PROCESSING;
		});
		builder.addCase(confirmDocumentUpload.fulfilled, (state, action) => {
			state.errorMessage = null;
			state.processingStatus = DocumentProcessingStatus.READY;
			state.activeDocumentId = action.payload.documentId;
			state.activeDocumentStatus = "UPLOADED";
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
			state.activeDocumentId = action.payload.id;
			state.activeDocumentStatus = "UPLOADED";
		});
		builder.addCase(submitManualText.rejected, (state, action) => {
			state.errorMessage = action.error.message ?? "Failed to submit text";
		});
		builder.addCase(pollDocumentStatus.pending, (state) => {
			state.errorMessage = null;
		});
		builder.addCase(pollDocumentStatus.fulfilled, (state, action) => {
			if (state.activeDocumentId !== action.meta.arg.documentId) {
				return;
			}
			state.activeDocumentStatus = action.payload.status;
			state.errorMessage = null;

			if (action.payload.status === "COMPLETED") {
				state.isAddingKnowledge = false;
				state.activeDocumentId = null;
				state.activeDocumentStatus = "IDLE";
				state.extractionItems = [];
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
		builder.addCase(submitExtractionReview.fulfilled, (state, action) => {
			if (action.payload.status === "COMPLETED") {
				state.activeDocumentId = null;
				state.activeDocumentStatus = "IDLE";
				state.extractionItems = [];
			} else {
				state.activeDocumentStatus = action.payload.status;
			}
		});
		builder.addCase(submitExtractionReview.rejected, (state, action) => {
			state.errorMessage =
				action.error.message ?? "Failed to submit extraction review";
		});
		builder.addCase(retryDocumentProcessing.pending, (state) => {
			state.errorMessage = null;
			state.activeDocumentStatus = "PROCESSING";
		});
		builder.addCase(retryDocumentProcessing.fulfilled, (state, action) => {
			state.errorMessage = null;
			state.activeDocumentStatus = action.payload.status;
		});
		builder.addCase(retryDocumentProcessing.rejected, (state, action) => {
			state.errorMessage = action.error.message ?? "Failed to retry processing";
			state.activeDocumentStatus = "FAILED";
		});
	},
	initialState,
	name: "knowledge",
	reducers: {
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
			state.activeDocumentId = null;
			state.activeDocumentStatus = "IDLE";
			state.errorMessage = null;
			state.extractionItems = [];
			state.integrationPreviewError = null;
			state.integrationPreviewSections = [];
			state.isAddingKnowledge = false;
			state.isIntegrationPreviewLoading = false;
			state.processingStatus = DocumentProcessingStatus.IDLE;
			state.selectedFiles = [];
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
	},
});

export { actions, name, reducer };
