import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";

import {
	type CreateProjectPayload,
	type WorkspacesApi,
} from "../api/workspaces-api.js";
import {
	MOCK_DOCUMENTS,
	MOCK_PROJECTS,
} from "../libs/constants/mock-data.constants.js";
import { type DocumentItem, type ProjectItem } from "../types/types.js";

interface WorkspacesState {
	documents: DocumentItem[];
	error: null | string;
	isLoading: boolean;
	projects: ProjectItem[];
}

const initialState: WorkspacesState = {
	documents: MOCK_DOCUMENTS,
	error: null,
	isLoading: false,
	projects: MOCK_PROJECTS,
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
		try {
			return await api.createProject(payload);
		} catch {
			return {
				description: payload.description ?? "",
				id: `proj-${String(Date.now())}`,
				members: ["/avatars/avatar-1.png"],
				name: payload.name,
				role: "ADMIN",
				updatedAt: "JUST NOW",
			};
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
			.addCase(createProject.fulfilled, (state, action) => {
				state.projects.unshift(action.payload);
			})
			.addCase(createProject.rejected, (state, action) => {
				const { payload } = action.meta.arg;
				state.projects.unshift({
					description: payload.description ?? "",
					id: `proj-${String(Date.now())}`,
					members: ["/avatars/avatar-1.png"],
					name: payload.name,
					role: "ADMIN",
					updatedAt: "JUST NOW",
				});
			});
	},
	initialState,
	name: "workspaces",
	reducers: {},
});

const workspacesReducer = workspacesSlice.reducer;

export { fetchProjects, fetchRecentDocuments, workspacesReducer };
