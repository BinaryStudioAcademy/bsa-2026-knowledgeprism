import { type AskPrismSourceDto } from "@knowledgeprism/types";
import { createSlice } from "@reduxjs/toolkit";

import { DataStatus } from "~/lib/enums/enums.js";
import { type ValueOf } from "~/lib/types/types.js";

import { DEFAULT_SUGGESTED_QUESTIONS } from "../libs/constants.js";
import { askQuestion, loadSuggestedQuestions } from "./actions.js";

type AskPrismErrorType = "connection" | "not_found" | null;

type State = {
	answer: null | string;
	dataStatus: ValueOf<typeof DataStatus>;
	errorType: AskPrismErrorType;
	isSuggestionsLoading: boolean;
	query: string;
	sources: AskPrismSourceDto[];
	suggestedQuestions: string[];
};

const EMPTY_COUNT = 0;

const initialState: State = {
	answer: null,
	dataStatus: DataStatus.IDLE,
	errorType: null,
	isSuggestionsLoading: false,
	query: "",
	sources: [],
	suggestedQuestions: DEFAULT_SUGGESTED_QUESTIONS,
};

const { actions, name, reducer } = createSlice({
	extraReducers(builder) {
		builder.addCase(askQuestion.pending, (state, action) => {
			state.answer = null;
			state.dataStatus = DataStatus.PENDING;
			state.errorType = null;
			state.query = action.meta.arg.query;
			state.sources = [];
		});
		builder.addCase(askQuestion.fulfilled, (state, action) => {
			state.answer = action.payload.answer;
			state.dataStatus = DataStatus.FULFILLED;
			state.sources = action.payload.sources;

			const isNotFoundInKnowledge =
				action.payload.sources.length === EMPTY_COUNT &&
				(action.payload.answer.toLowerCase().includes("not found") ||
					action.payload.answer.toLowerCase().includes("no info"));

			state.errorType = isNotFoundInKnowledge ? "not_found" : null;
		});
		builder.addCase(askQuestion.rejected, (state, action) => {
			state.answer = null;
			state.dataStatus = DataStatus.REJECTED;
			state.sources = [];
			state.errorType =
				action.payload &&
				typeof action.payload === "object" &&
				"errorType" in action.payload
					? (action.payload as { errorType: AskPrismErrorType }).errorType
					: "connection";
		});

		builder.addCase(loadSuggestedQuestions.pending, (state) => {
			state.isSuggestionsLoading = true;
		});
		builder.addCase(loadSuggestedQuestions.fulfilled, (state, action) => {
			state.isSuggestionsLoading = false;
			state.suggestedQuestions = action.payload;
		});
		builder.addCase(loadSuggestedQuestions.rejected, (state) => {
			state.isSuggestionsLoading = false;
		});
	},
	initialState,
	name: "askPrism",
	reducers: {
		reset(state) {
			state.answer = null;
			state.dataStatus = DataStatus.IDLE;
			state.errorType = null;
			state.query = "";
			state.sources = [];
		},
	},
});

export { actions, name, reducer };
export { type AskPrismErrorType };
