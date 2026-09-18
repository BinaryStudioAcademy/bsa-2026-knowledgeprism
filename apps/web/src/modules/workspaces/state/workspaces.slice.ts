import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";

import { type WorkspacesApi } from "../api/workspaces-api.js";
import { type ProjectItem, type RecentDocumentItem } from "../types/types.js";
import { createProject, updateProject } from "./action.js";

interface WorkspacesState {
	creationError: null | string;
	error: null | string;
	isCreating: boolean;
	isLoading: boolean;
	isLoadingRecent: boolean;
	isUpdating: boolean;
	projects: ProjectItem[];
	recentDocuments: RecentDocumentItem[];
	updateError: null | string;
}

const initialState: WorkspacesState = {
	creationError: null,
	error: null,
	isCreating: false,
	isLoading: false,
	isLoadingRecent: false,
	isUpdating: false,
	projects: [],
	recentDocuments: [],
	updateError: null,
};

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
			})
			.addCase(createProject.pending, (state) => {
				state.isCreating = true;
				state.creationError = null;
			})
			.addCase(createProject.fulfilled, (state, action) => {
				state.isCreating = false;
				state.projects.unshift(action.payload);
			})
			.addCase(createProject.rejected, (state, action) => {
				state.isCreating = false;
				state.creationError =
					action.error.message ?? "Failed to create project";
			})
			.addCase(updateProject.pending, (state) => {
				state.isUpdating = true;
				state.updateError = null;
			})
			.addCase(updateProject.fulfilled, (state, action) => {
				state.isUpdating = false;
				state.projects = state.projects.map((project) =>
					project.id === action.payload.id
						? { ...project, ...action.payload, role: project.role }
						: project,
				);
			})
			.addCase(updateProject.rejected, (state, action) => {
				state.isUpdating = false;
				state.updateError = action.error.message ?? "Failed to update project";
			});
	},
	initialState,
	name: "workspaces",
	reducers: {},
});

const workspacesReducer = workspacesSlice.reducer;

export { createProject, updateProject } from "./action.js";
export { fetchProjects, fetchRecentDocuments, workspacesReducer };
