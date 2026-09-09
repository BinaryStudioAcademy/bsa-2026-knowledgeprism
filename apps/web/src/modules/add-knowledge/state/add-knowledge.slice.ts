import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

import { DocumentValidationMessage } from "../libs/constants/constants.js";
import { DocumentProcessingStatus } from "../libs/enums/enums.js";
import { formatFileSize } from "../libs/helpers/helpers.js";
import { type AddKnowledgeState } from "../libs/types/types.js";
import { processDocument } from "./actions.js";

type State = AddKnowledgeState;

const initialState: State = {
	errorMessage: null,
	processingStatus: DocumentProcessingStatus.IDLE,
	selectedFile: null,
};

const INITIAL_PROGRESS = 15;
const IN_PROGRESS_PERCENTAGE = 50;

const { actions, name, reducer } = createSlice({
	extraReducers(builder) {
		builder.addCase(processDocument.pending, (state) => {
			state.errorMessage = null;
			state.processingStatus = DocumentProcessingStatus.PROCESSING;

			if (state.selectedFile) {
				state.selectedFile.status = DocumentProcessingStatus.PROCESSING;
				state.selectedFile.progress = IN_PROGRESS_PERCENTAGE;
			}
		});
		builder.addCase(processDocument.fulfilled, (state, action) => {
			state.errorMessage = null;
			state.processingStatus = DocumentProcessingStatus.SUCCESS;
			state.selectedFile = action.payload;
		});
		builder.addCase(processDocument.rejected, (state, action) => {
			state.errorMessage =
				action.error.message ?? DocumentValidationMessage.PROCESSING_FAILED;
			state.processingStatus = DocumentProcessingStatus.FAILED;

			if (state.selectedFile) {
				state.selectedFile.status = DocumentProcessingStatus.FAILED;
			}
		});
	},
	initialState,
	name: "add-knowledge",
	reducers: {
		clearError(state) {
			state.errorMessage = null;
		},
		removeDocument(state) {
			state.errorMessage = null;
			state.processingStatus = DocumentProcessingStatus.IDLE;
			state.selectedFile = null;
		},
		resetState() {
			return initialState;
		},
		setError(state, action: PayloadAction<string>) {
			state.errorMessage = action.payload;
			state.processingStatus = DocumentProcessingStatus.FAILED;
			state.selectedFile = null;
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
