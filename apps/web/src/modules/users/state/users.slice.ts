import {
	type UserDetailsResponseDto,
	type UserGetAllItemResponseDto,
} from "@knowledgeprism/types";
import { createSlice } from "@reduxjs/toolkit";

import { DataStatus } from "~/lib/enums/enums.js";
import { type ValueOf } from "~/lib/types/types.js";

import { createUser, loadAll, loadUserById, updateUser } from "./actions.js";

type State = {
	dataStatus: ValueOf<typeof DataStatus>;
	selectedUser: null | UserDetailsResponseDto;
	selectedUserStatus: ValueOf<typeof DataStatus>;
	users: UserGetAllItemResponseDto[];
};

const initialState: State = {
	dataStatus: DataStatus.IDLE,
	selectedUser: null,
	selectedUserStatus: DataStatus.IDLE,
	users: [],
};

const { actions, name, reducer } = createSlice({
	extraReducers(builder) {
		builder.addCase(loadAll.pending, (state) => {
			state.dataStatus = DataStatus.PENDING;
		});
		builder.addCase(loadAll.fulfilled, (state, action) => {
			state.users = action.payload.items;
			state.dataStatus = DataStatus.FULFILLED;
		});
		builder.addCase(loadAll.rejected, (state) => {
			state.dataStatus = DataStatus.REJECTED;
		});
		builder.addCase(loadUserById.pending, (state) => {
			state.selectedUserStatus = DataStatus.PENDING;
		});
		builder.addCase(loadUserById.fulfilled, (state, action) => {
			state.selectedUser = action.payload;
			state.selectedUserStatus = DataStatus.FULFILLED;
		});
		builder.addCase(loadUserById.rejected, (state) => {
			state.selectedUserStatus = DataStatus.REJECTED;
		});
		builder.addCase(createUser.pending, (state) => {
			state.dataStatus = DataStatus.PENDING;
		});
		builder.addCase(createUser.fulfilled, (state) => {
			state.dataStatus = DataStatus.FULFILLED;
		});
		builder.addCase(createUser.rejected, (state) => {
			state.dataStatus = DataStatus.REJECTED;
		});
		builder.addCase(updateUser.pending, (state) => {
			state.dataStatus = DataStatus.PENDING;
		});
		builder.addCase(updateUser.fulfilled, (state) => {
			state.dataStatus = DataStatus.FULFILLED;
		});
		builder.addCase(updateUser.rejected, (state) => {
			state.dataStatus = DataStatus.REJECTED;
		});
	},
	initialState,
	name: "users",
	reducers: {},
});

export { actions, name, reducer };
