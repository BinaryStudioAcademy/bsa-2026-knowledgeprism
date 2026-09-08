import { type UserSignUpResponseDto } from "@knowledgeprism/types";
import { createSlice } from "@reduxjs/toolkit";

import { DataStatus } from "~/lib/enums/enums.js";
import { type ValueOf } from "~/lib/types/types.js";

import { logout, signUp } from "./actions.js";

type State = {
	dataStatus: ValueOf<typeof DataStatus>;
	user: null | UserSignUpResponseDto;
};

const initialState: State = {
	dataStatus: DataStatus.IDLE,
	user: null,
};

const { actions, name, reducer } = createSlice({
	extraReducers(builder) {
		builder.addCase(signUp.pending, (state) => {
			state.dataStatus = DataStatus.PENDING;
		});
		builder.addCase(signUp.fulfilled, (state, action) => {
			state.dataStatus = DataStatus.FULFILLED;
			state.user = action.payload;
		});
		builder.addCase(signUp.rejected, (state) => {
			state.dataStatus = DataStatus.REJECTED;
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
