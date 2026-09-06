import { type AskPrismSourceDto } from "@knowledgeprism/types";
import { createSlice } from "@reduxjs/toolkit";

import { DataStatus } from "~/lib/enums/enums.js";
import { type ValueOf } from "~/lib/types/types.js";

import { askQuestion } from "./actions.js";

type State = {
	answer: null | string;
	dataStatus: ValueOf<typeof DataStatus>;
	query: string;
	sources: AskPrismSourceDto[];
};

const initialState: State = {
	answer: null,
	dataStatus: DataStatus.IDLE,
	query: "",
	sources: [],
};

const { actions, name, reducer } = createSlice({
	extraReducers(builder) {
		builder.addCase(askQuestion.pending, (state, action) => {
			state.dataStatus = DataStatus.PENDING;
			state.query = action.meta.arg.query;
			state.answer = null;
			state.sources = [];
		});
		builder.addCase(askQuestion.fulfilled, (state, action) => {
			state.dataStatus = DataStatus.FULFILLED;
			state.answer = action.payload.answer;
			state.sources = action.payload.sources;
		});
		builder.addCase(askQuestion.rejected, (state) => {
			state.dataStatus = DataStatus.REJECTED;
			state.answer = null;
			state.sources = [];
		});
	},
	initialState,
	name: "askPrism",
	reducers: {
		reset(state) {
			state.answer = null;
			state.dataStatus = DataStatus.IDLE;
			state.query = "";
			state.sources = [];
		},
	},
});

export { actions, name, reducer };
