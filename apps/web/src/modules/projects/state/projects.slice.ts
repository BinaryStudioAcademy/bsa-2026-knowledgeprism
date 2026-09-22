import { type ProjectGetAllItemResponseDto } from "@knowledgeprism/types";
import { createSlice } from "@reduxjs/toolkit";

import { DataStatus } from "~/lib/enums/enums.js";
import { type ValueOf } from "~/lib/types/types.js";

import { loadAllProjects } from "./actions.js";

type State = {
	dataStatus: ValueOf<typeof DataStatus>;
	projects: ProjectGetAllItemResponseDto[];
};

const initialState: State = {
	dataStatus: DataStatus.IDLE,
	projects: [],
};

const { reducer } = createSlice({
	extraReducers: (builder) => {
		builder.addCase(loadAllProjects.pending, (state) => {
			state.dataStatus = DataStatus.PENDING;
		});
		builder.addCase(loadAllProjects.fulfilled, (state, action) => {
			state.dataStatus = DataStatus.FULFILLED;
			state.projects = action.payload.items;
		});
		builder.addCase(loadAllProjects.rejected, (state) => {
			state.dataStatus = DataStatus.REJECTED;
		});
	},
	initialState,
	name: "projects",
	reducers: {},
});

export { reducer };
