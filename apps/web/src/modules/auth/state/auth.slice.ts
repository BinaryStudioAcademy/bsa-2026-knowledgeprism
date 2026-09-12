import { type UserSignUpResponseDto } from "@knowledgeprism/types";
import { createSlice } from "@reduxjs/toolkit";

import { DataStatus } from "~/lib/enums/enums.js";
import { type ValueOf } from "~/lib/types/types.js";

import { loadCurrentUser, logout, signIn, signUp } from "./actions.js";

type State = {
	dataStatus: ValueOf<typeof DataStatus>;
	error: null | string;
	user: null | UserSignUpResponseDto;
};

const initialState: State = {
	dataStatus: DataStatus.IDLE,
	error: null,
	user: null,
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
			state.error = null;
			state.user = action.payload;
		});
		builder.addCase(loadCurrentUser.rejected, (state, action) => {
			state.dataStatus = DataStatus.REJECTED;
			state.error = action.error.message ?? null;
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
	},
	initialState,
	name: "auth",
	reducers: {},
});

export { actions, name, reducer };
