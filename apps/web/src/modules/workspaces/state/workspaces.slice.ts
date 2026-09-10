import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";

import {
	type CreateProjectPayload,
	type WorkspacesApi,
} from "../api/workspaces-api.js";
import { MOCK_PROJECTS } from "../libs/constants/mock-data.constants.js";
import { type ProjectItem } from "../types/types.js";

interface WorkspacesState {
	error: null | string;
	isLoading: boolean;
	projects: ProjectItem[];
}

const initialState: WorkspacesState = {
	error: null,
	isLoading: false,
	projects: MOCK_PROJECTS,
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
		try {
			return await api.createProject(payload);
		} catch {
			return {
				description: payload.description ?? "",
				id: `proj-${String(Date.now())}`,
				name: payload.name,
				role: "ADMIN",
				updatedAt: "JUST NOW",
			};
		}
	},
);

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

const workspacesSlice = createSlice({
	extraReducers: (builder) => {
		builder
			.addCase(createProject.fulfilled, (state, action) => {
				state.projects.unshift(action.payload);
			})
			.addCase(createProject.rejected, (state, action) => {
				const { payload } = action.meta.arg;
				state.projects.unshift({
					description: payload.description ?? "",
					id: `proj-${String(Date.now())}`,
					name: payload.name,
					role: "ADMIN",
					updatedAt: "JUST NOW",
				});
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
				state.projects = MOCK_PROJECTS;
			});
	},
	initialState,
	name: "workspaces",
	reducers: {},
});

const workspacesReducer = workspacesSlice.reducer;

/** @public */
export { createProject, fetchProjects, workspacesReducer };
