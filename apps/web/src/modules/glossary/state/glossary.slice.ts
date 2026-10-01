import {
	type GlossaryTermItemDto,
	type GlossaryTermResponseDto,
} from "@knowledgeprism/types";
import { createSlice } from "@reduxjs/toolkit";

import { DataStatus } from "~/lib/enums/enums.js";
import { type ValueOf } from "~/lib/types/types.js";

import {
	confirmTerm,
	createTerm,
	deleteTerm,
	loadTerm,
	loadTermOptions,
	loadTerms,
	updateTerm,
} from "./actions.js";

type State = {
	dataStatus: ValueOf<typeof DataStatus>;
	projectId: null | string;
	revision: number;
	selectedTerm: GlossaryTermResponseDto | null;
	selectedTermStatus: ValueOf<typeof DataStatus>;
	termOptions: GlossaryTermItemDto[];
	terms: GlossaryTermItemDto[];
};

const INITIAL_REVISION = 0;
const REVISION_STEP = 1;

const initialState: State = {
	dataStatus: DataStatus.IDLE,
	projectId: null,
	revision: INITIAL_REVISION,
	selectedTerm: null,
	selectedTermStatus: DataStatus.IDLE,
	termOptions: [],
	terms: [],
};

const { name, reducer } = createSlice({
	extraReducers(builder) {
		builder.addCase(loadTerms.pending, (state, action) => {
			if (state.projectId !== action.meta.arg.projectId) {
				state.projectId = action.meta.arg.projectId;
				state.selectedTerm = null;
				state.termOptions = [];
				state.terms = [];
			}

			state.dataStatus = DataStatus.PENDING;
		});
		builder.addCase(loadTerms.fulfilled, (state, action) => {
			state.dataStatus = DataStatus.FULFILLED;
			state.terms = action.payload.items;
		});
		builder.addCase(loadTerms.rejected, (state, action) => {
			if (!action.meta.aborted) {
				state.dataStatus = DataStatus.REJECTED;
			}
		});

		builder.addCase(loadTermOptions.fulfilled, (state, action) => {
			state.termOptions = action.payload.items;
		});

		builder.addCase(loadTerm.pending, (state) => {
			state.selectedTerm = null;
			state.selectedTermStatus = DataStatus.PENDING;
		});
		builder.addCase(loadTerm.fulfilled, (state, action) => {
			state.selectedTerm = action.payload;
			state.selectedTermStatus = DataStatus.FULFILLED;
		});
		builder.addCase(loadTerm.rejected, (state, action) => {
			if (!action.meta.aborted) {
				state.selectedTermStatus = DataStatus.REJECTED;
			}
		});

		builder.addCase(createTerm.fulfilled, (state) => {
			state.revision += REVISION_STEP;
		});

		builder.addCase(updateTerm.fulfilled, (state, action) => {
			state.revision += REVISION_STEP;
			state.selectedTerm = action.payload;
		});

		builder.addCase(confirmTerm.fulfilled, (state, action) => {
			const { id, origin } = action.payload;

			state.selectedTerm = action.payload;
			state.terms = state.terms.map((term) =>
				term.id === id ? { ...term, origin } : term,
			);
		});

		builder.addCase(deleteTerm.fulfilled, (state, action) => {
			state.revision += REVISION_STEP;
			state.selectedTerm = null;
			state.terms = state.terms.filter((term) => term.id !== action.payload);
		});
	},
	initialState,
	name: "glossary",
	reducers: {},
});

export { name, reducer };
