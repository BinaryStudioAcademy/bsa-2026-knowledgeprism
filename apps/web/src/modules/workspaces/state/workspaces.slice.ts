import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { createProject, updateProject } from "./action.js";

import { type WorkspacesApi } from "../api/workspaces-api.js";
import {
	MOCK_DOCUMENTS,
	MOCK_PROJECTS,
} from "../libs/constants/mock-data.constants.js";
import { type DocumentItem, type ProjectItem } from "../types/types.js";

interface WorkspacesState {
	createError: null | string;
	documents: DocumentItem[];
	error: null | string;
	isCreating: boolean;
	isLoading: boolean;
	isUpdating: boolean;
	projects: ProjectItem[];
	updateError: null | string;
}

const initialState: WorkspacesState = {
	createError: null,
	documents: MOCK_DOCUMENTS,
	error: null,
	isCreating: false,
	isLoading: false,
	isUpdating: false,
	projects: MOCK_PROJECTS,
	updateError: null,
};

const fetchProjects = createAsyncThunk(
	"workspaces/fetchProjects",
	async (api: WorkspacesApi) => {
		try {
			return await api.getProjects();
		} catch {
			return MOCK_PROJECTS;
		}
	},
);

const fetchRecentDocuments = createAsyncThunk(
	"workspaces/fetchRecentDocuments",
	async (api: WorkspacesApi) => {
		try {
			return await api.getRecentDocuments();
		} catch {
			return MOCK_DOCUMENTS;
		}
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
				state.projects = MOCK_PROJECTS;
			})
			.addCase(fetchRecentDocuments.fulfilled, (state, action) => {
				state.documents = action.payload;
			})
			.addCase(fetchRecentDocuments.rejected, (state) => {
				state.documents = MOCK_DOCUMENTS;
			})
			.addCase(createProject.pending, (state) => {
				state.isCreating = true;
				state.createError = null;
			})
			.addCase(createProject.fulfilled, (state, action) => {
				state.isCreating = false;
				state.projects.unshift(action.payload);
			})
			.addCase(createProject.rejected, (state, action) => {
				state.isCreating = false;
				state.createError = action.error.message ?? "Failed to create project";
			})
			.addCase(updateProject.pending, (state) => {
				state.isUpdating = true;
				state.updateError = null;
			})
			.addCase(updateProject.fulfilled, (state, action) => {
				state.isUpdating = false;
				state.projects = state.projects.map((project) =>
					project.id === action.payload.id
						? { ...project, ...action.payload }
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

export {
	createProject,
	fetchProjects,
	fetchRecentDocuments,
	updateProject,
	workspacesReducer,
};
