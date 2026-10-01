import { HTTPCode } from "@knowledgeprism/constants";
import { type AskPrismResponseDto } from "@knowledgeprism/types";
import { createAsyncThunk } from "@reduxjs/toolkit";

import { HTTPError } from "~/lib/http/http.js";
import { type AsyncThunkConfig } from "~/lib/types/types.js";

import { DEFAULT_SUGGESTED_QUESTIONS, SLICE_NAME } from "../libs/constants.js";
import { type AskPrismErrorType } from "../libs/types/types.js";

const isUnauthorizedError = (error: unknown): error is HTTPError => {
	return error instanceof HTTPError && error.status === HTTPCode.UNAUTHORIZED;
};

const askQuestion = createAsyncThunk<
	AskPrismResponseDto,
	{ messageId?: string; projectId: number | string; query: string },
	AsyncThunkConfig & { rejectValue: { errorType: AskPrismErrorType } }
>(
	`${SLICE_NAME}/ask-question`,
	async ({ projectId, query }, { extra, rejectWithValue }) => {
		const { askPrismApi } = extra;

		try {
			return await askPrismApi.ask(projectId, { query });
		} catch (error: unknown) {
			if (isUnauthorizedError(error)) {
				throw error;
			}

			const isNotFoundError =
				error instanceof HTTPError && error.status === HTTPCode.NOT_FOUND;

			return rejectWithValue({
				errorType: isNotFoundError ? "not_found" : "connection",
			});
		}
	},
);

const loadSuggestedQuestions = createAsyncThunk<
	string[],
	{ projectId: number | string },
	AsyncThunkConfig
>(
	`${SLICE_NAME}/load-suggested-questions`,
	async ({ projectId }, { extra }) => {
		const { askPrismApi } = extra;

		try {
			return await askPrismApi.getSuggestedQuestions(projectId);
		} catch (error: unknown) {
			if (isUnauthorizedError(error)) {
				throw error;
			}

			return DEFAULT_SUGGESTED_QUESTIONS;
		}
	},
);

export { askQuestion, loadSuggestedQuestions };
