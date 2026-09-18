import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";

import {
	type CreateProjectPayload,
	type WorkspacesApi,
} from "../api/workspaces-api.js";
import { type ProjectItem, type RecentDocumentItem } from "../types/types.js";

interface WorkspacesState {
	error: null | string;
	isLoading: boolean;
	isLoadingRecent: boolean;
	projects: ProjectItem[];
	recentDocuments: RecentDocumentItem[];
}

const initialState: WorkspacesState = {
	error: null,
	isLoading: false,
	isLoadingRecent: false,
	projects: [],
	recentDocuments: [],
};

const createProject = createAsyncThunk<
	ProjectItem,
	{
		api: WorkspacesApi;
		payload: CreateProjectPayload;
	}
>(
	"workspaces/createProject",
	async ({
		api,
		payload,
	}: {
		api: WorkspacesApi;
		payload: CreateProjectPayload;
	}) => {
		return await api.createProject(payload);
	},
);

const fetchProjects = createAsyncThunk(
	"workspaces/fetchProjects",
	async (api: WorkspacesApi) => {
		return await api.getProjects();
	},
);

const fetchRecentDocuments = createAsyncThunk(
	"workspaces/fetchRecentDocuments",
	async (api: WorkspacesApi) => {
		return await api.getRecentDocuments();
	},
);

const workspacesSlice = createSlice({
	extraReducers: (builder) => {
		builder
			.addCase(createProject.fulfilled, (state, action) => {
				state.projects.unshift(action.payload);
			})
			.addCase(fetchProjects.pending, (state) => {
				state.isLoading = true;
				state.error = null;
			})
			.addCase(fetchProjects.fulfilled, (state, action) => {
				state.isLoading = false;
				state.projects = action.payload;
			})
			.addCase(fetchProjects.rejected, (state) => {
				state.isLoading = false;
			})
			.addCase(fetchRecentDocuments.pending, (state) => {
				state.isLoadingRecent = true;
			})
			.addCase(fetchRecentDocuments.fulfilled, (state, action) => {
				state.isLoadingRecent = false;
				state.recentDocuments = action.payload;
			})
			.addCase(fetchRecentDocuments.rejected, (state) => {
				state.isLoadingRecent = false;
			});
	},
	initialState,
	name: "workspaces",
	reducers: {},
});

const workspacesReducer = workspacesSlice.reducer;

export { fetchProjects, fetchRecentDocuments, workspacesReducer };
