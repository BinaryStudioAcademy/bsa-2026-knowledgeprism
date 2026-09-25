import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

import { DocumentValidationMessage } from "../libs/constants/constants.js";
import { DocumentProcessingStatus, SearchStatus } from "../libs/enums/enums.js";
import { formatFileSize } from "../libs/helpers/helpers.js";
import { type KnowledgeState } from "../libs/types/types.js";
import {
	confirmDocumentUpload,
	fetchExtractionItems,
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
	isAddingKnowledge: false,
	isEntryLoading: false,
	isTreeLoading: false,
	processingStatus: DocumentProcessingStatus.IDLE,
	searchErrorMessage: null,
	searchQuery: "",
	searchResults: [],
	searchStatus: SearchStatus.IDLE,
	selectedEntry: null,
	selectedFile: null,
	tree: [],
};

const INITIAL_PROGRESS = 15;
const IN_PROGRESS_PERCENTAGE = 50;

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
		builder.addCase(processDocument.pending, (state) => {
			state.errorMessage = null;
			state.processingStatus = DocumentProcessingStatus.PROCESSING;

			if (state.selectedFile) {
				state.selectedFile.status = DocumentProcessingStatus.PROCESSING;
				state.selectedFile.progress = IN_PROGRESS_PERCENTAGE;
			}
		});
		builder.addCase(processDocument.fulfilled, (state, action) => {
			if (!state.selectedFile || state.selectedFile.id !== action.meta.arg.id) {
				return;
			}

			state.errorMessage = null;
			state.processingStatus = DocumentProcessingStatus.READY;
			state.selectedFile = action.payload;
		});
		builder.addCase(processDocument.rejected, (state, action) => {
			if (!state.selectedFile || state.selectedFile.id !== action.meta.arg.id) {
				return;
			}

			state.errorMessage =
				action.payload?.message ?? DocumentValidationMessage.PROCESSING_FAILED;
			state.processingStatus = DocumentProcessingStatus.FAILED;
			state.selectedFile.status = DocumentProcessingStatus.FAILED;
			state.selectedFile.documentId = action.payload?.documentId;
			state.selectedFile.uploadUrl = action.payload?.uploadUrl;
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
		finishAddingKnowledge(state) {
			state.isAddingKnowledge = false;
		},
		removeDocument(state) {
			state.errorMessage = null;
			state.processingStatus = DocumentProcessingStatus.IDLE;
			state.selectedFile = null;
		},
		resetState(state) {
			state.errorMessage = null;
			state.processingStatus = DocumentProcessingStatus.IDLE;
			state.selectedFile = null;
			state.activeDocumentId = null;
			state.activeDocumentStatus = "IDLE";
			state.extractionItems = [];
			state.isAddingKnowledge = false;
		},
		setError(state, action: PayloadAction<string>) {
			state.errorMessage = action.payload;
			state.processingStatus = DocumentProcessingStatus.FAILED;
			state.selectedFile = null;
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
			state.selectedFile = {
				id,
				name,
				progress: INITIAL_PROGRESS,
				size,
				sizeLabel: formatFileSize(size),
				status: DocumentProcessingStatus.PROCESSING,
			};
		},
	},
});

export { actions, name, reducer };
