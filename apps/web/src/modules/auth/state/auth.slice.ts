import { type UserSignUpResponseDto } from "@knowledgeprism/types";
import { createSlice, isRejected, type UnknownAction } from "@reduxjs/toolkit";

import { DataStatus } from "~/lib/enums/enums.js";
import { HTTPCode } from "~/lib/http/http.js";
import { type ValueOf } from "~/lib/types/types.js";

import { loadCurrentUser, logout, signIn, signUp } from "./actions.js";

type State = {
	dataStatus: ValueOf<typeof DataStatus>;
	error: null | string;
	isInitialized: boolean;
	user: null | UserSignUpResponseDto;
};

const initialState: State = {
	dataStatus: DataStatus.IDLE,
	error: null,
	isInitialized: false,
	user: null,
};

const isUnauthorizedAction = (action: UnknownAction): boolean => {
	return (
		isRejected(action) &&
		"status" in action.error &&
		action.error.status === HTTPCode.UNAUTHORIZED
	);
};

const { actions, name, reducer } = createSlice({
	extraReducers(builder) {
		builder.addCase(signIn.pending, (state) => {
			state.dataStatus = DataStatus.PENDING;
			state.error = null;
		});
		builder.addCase(signIn.fulfilled, (state, action) => {
			state.dataStatus = DataStatus.FULFILLED;
			state.error = null;
			state.user = action.payload;
		});
		builder.addCase(signIn.rejected, (state, action) => {
			state.dataStatus = DataStatus.REJECTED;
			state.error = action.error.message ?? null;
			state.user = null;
		});
		builder.addCase(signUp.pending, (state) => {
			state.dataStatus = DataStatus.PENDING;
			state.error = null;
		});
		builder.addCase(signUp.fulfilled, (state, action) => {
			state.dataStatus = DataStatus.FULFILLED;
			state.error = null;
			state.user = action.payload;
		});
		builder.addCase(signUp.rejected, (state, action) => {
			state.dataStatus = DataStatus.REJECTED;
			state.error = action.error.message ?? null;
			state.user = null;
		});
		builder.addCase(loadCurrentUser.pending, (state) => {
			state.dataStatus = DataStatus.PENDING;
			state.error = null;
		});
		builder.addCase(loadCurrentUser.fulfilled, (state, action) => {
			state.dataStatus = DataStatus.FULFILLED;
			state.isInitialized = true;
			state.user = action.payload;
		});
		builder.addCase(loadCurrentUser.rejected, (state) => {
			state.dataStatus = DataStatus.REJECTED;
			state.error = null;
			state.isInitialized = true;
			state.user = null;
		});
		builder.addCase(logout.pending, (state) => {
			state.dataStatus = DataStatus.PENDING;
		});
		builder.addCase(logout.fulfilled, (state) => {
			state.dataStatus = DataStatus.IDLE;
			state.user = null;
		});
		builder.addCase(logout.rejected, (state) => {
			state.dataStatus = DataStatus.REJECTED;
		});
		builder.addMatcher(isUnauthorizedAction, (state) => {
			state.user = null;
		});
	},
	initialState,
	name: "auth",
	reducers: {
		clearError(state) {
			state.error = null;
		},
	},
});

export { actions, name, reducer };
