import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

import { DataStatus } from "~/lib/enums/enums.js";
import { type ValueOf } from "~/lib/types/types.js";

import { DEFAULT_SUGGESTED_QUESTIONS, SLICE_NAME } from "../libs/constants.js";
import {
	clearConversationHistory,
	readConversationHistory,
	writeConversationHistory,
} from "../libs/helpers/helpers.js";
import { type AskPrismMessage } from "../libs/types/types.js";
import { askQuestion, loadSuggestedQuestions } from "./actions.js";

type State = {
	conversationsByProject: Record<number, AskPrismMessage[]>;
	currentAskRequestId: null | string;
	currentProjectId: null | number;
	currentSuggestionsRequestId: null | string;
	dataStatus: ValueOf<typeof DataStatus>;
	isSuggestionsLoading: boolean;
	suggestedQuestions: string[];
};

const EMPTY_COUNT = 0;

const initialState: State = {
	conversationsByProject: {},
	currentAskRequestId: null,
	currentProjectId: null,
	currentSuggestionsRequestId: null,
	dataStatus: DataStatus.IDLE,
	isSuggestionsLoading: false,
	suggestedQuestions: DEFAULT_SUGGESTED_QUESTIONS,
};

const getTargetMessageContext = (
	state: State,
	projectId: number,
	messageId: string,
): null | { message: AskPrismMessage; projectMessages: AskPrismMessage[] } => {
	const projectMessages = state.conversationsByProject[projectId];
	const message = projectMessages?.find((item) => item.id === messageId);

	if (!projectMessages || !message) {
		return null;
	}

	return { message, projectMessages };
};

const { actions, reducer } = createSlice({
	extraReducers(builder) {
		builder.addCase(askQuestion.pending, (state, action) => {
			const projectId = Number(action.meta.arg.projectId);
			state.currentAskRequestId = action.meta.requestId;
			state.currentProjectId = projectId;
			state.dataStatus = DataStatus.PENDING;

			state.conversationsByProject[projectId] ??=
				readConversationHistory(projectId);

			const projectMessages = state.conversationsByProject[projectId];
			const messageId = action.meta.arg.messageId;

			if (messageId) {
				const context = getTargetMessageContext(state, projectId, messageId);

				if (context) {
					context.message.dataStatus = DataStatus.PENDING;
					context.message.errorType = null;

					return;
				}
			}

			projectMessages.push({
				answer: null,
				dataStatus: DataStatus.PENDING,
				errorType: null,
				id: action.meta.requestId,
				query: action.meta.arg.query,
				sources: [],
			});
		});

		builder.addCase(askQuestion.fulfilled, (state, action) => {
			const projectId = Number(action.meta.arg.projectId);
			state.dataStatus = DataStatus.FULFILLED;

			const messageId = action.meta.arg.messageId ?? action.meta.requestId;
			const context = getTargetMessageContext(state, projectId, messageId);

			if (!context) {
				return;
			}

			const { message: targetMessage, projectMessages } = context;

			targetMessage.answer = action.payload.answer;
			targetMessage.dataStatus = DataStatus.FULFILLED;
			targetMessage.sources = action.payload.sources;

			const isNotFoundInKnowledge =
				action.payload.sources.length === EMPTY_COUNT &&
				(action.payload.answer.toLowerCase().includes("not found") ||
					action.payload.answer.toLowerCase().includes("no info"));

			targetMessage.errorType = isNotFoundInKnowledge ? "not_found" : null;

			writeConversationHistory(projectId, projectMessages);
		});

		builder.addCase(askQuestion.rejected, (state, action) => {
			const projectId = Number(action.meta.arg.projectId);
			state.dataStatus = DataStatus.REJECTED;

			const messageId = action.meta.arg.messageId ?? action.meta.requestId;
			const context = getTargetMessageContext(state, projectId, messageId);

			if (!context) {
				return;
			}

			const { message: targetMessage, projectMessages } = context;

			targetMessage.dataStatus = DataStatus.REJECTED;
			targetMessage.errorType = action.payload?.errorType ?? "connection";

			writeConversationHistory(projectId, projectMessages);
		});

		builder.addCase(loadSuggestedQuestions.pending, (state, action) => {
			state.currentSuggestionsRequestId = action.meta.requestId;
			state.currentProjectId = Number(action.meta.arg.projectId);
			state.isSuggestionsLoading = true;
		});

		builder.addCase(loadSuggestedQuestions.fulfilled, (state, action) => {
			if (state.currentSuggestionsRequestId !== action.meta.requestId) {
				return;
			}
			state.isSuggestionsLoading = false;
			state.suggestedQuestions = action.payload;
		});

		builder.addCase(loadSuggestedQuestions.rejected, (state, action) => {
			if (state.currentSuggestionsRequestId !== action.meta.requestId) {
				return;
			}
			state.isSuggestionsLoading = false;
		});
	},
	initialState,
	name: SLICE_NAME,
	reducers: {
		clearHistory(state, action: PayloadAction<{ projectId: number }>) {
			const { projectId } = action.payload;
			state.conversationsByProject[projectId] = [];
			clearConversationHistory(projectId);
		},
		initProject(state, action: PayloadAction<{ projectId: number }>) {
			const { projectId } = action.payload;
			state.currentProjectId = projectId;

			state.conversationsByProject[projectId] ??=
				readConversationHistory(projectId);
		},
		reset(state) {
			state.conversationsByProject = {};
			state.currentAskRequestId = null;
			state.currentProjectId = null;
			state.currentSuggestionsRequestId = null;
			state.dataStatus = DataStatus.IDLE;
			state.isSuggestionsLoading = false;
			state.suggestedQuestions = DEFAULT_SUGGESTED_QUESTIONS;
		},
	},
});

export { actions, reducer };
export {
	type AskPrismErrorType,
	type AskPrismMessage,
} from "../libs/types/types.js";
