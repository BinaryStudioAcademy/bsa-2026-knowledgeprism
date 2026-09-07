import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";

import {
	type CreateProjectPayload,
	type WorkspacesApi,
} from "../api/workspaces-api.js";
import {
	type DocumentItem,
	type ProjectItem,
} from "../components/workspace-page.js";

interface WorkspacesState {
	documents: DocumentItem[];
	error: null | string;
	isLoading: boolean;
	projects: ProjectItem[];
}

const mockProjects: ProjectItem[] = [
	{
		description:
			"Hardware specifications, thermal management protocols, and display calibration data for next-gen.",
		id: "1",
		members: ["/avatars/avatar-5c4764.jpg", "/avatars/avatar-7fd8ac.jpg"],
		name: "iPhone Engineering",
		role: "ADMIN",
		updatedAt: "2h ago",
	},
	{
		description:
			"Window tiling documentation, Continuity features, and kernel extension deprecation notices.",
		id: "2",
		members: ["/avatars/avatar-8d39d3.jpg"],
		name: "macOS Sequoia",
		role: "VIEWER",
		updatedAt: "3 days ago",
	},
	{
		description:
			"Human Interface Guidelines, dynamic island animations, and widget state management.",
		id: "3",
		members: ["/avatars/avatar-744eba.jpg", "/avatars/avatar-24253a.jpg"],
		name: "iOS UI Kit",
		role: "EDITOR",
		updatedAt: "1 week ago",
	},
];

const mockDocuments: DocumentItem[] = [
	{ id: "1", title: "Camera system", updatedAt: "2h ago" },
	{ id: "2", title: "Processor architecture", updatedAt: "1d ago" },
	{ id: "3", title: "System Architecture V2", updatedAt: "Just now" },
];

const initialState: WorkspacesState = {
	documents: mockDocuments,
	error: null,
	isLoading: false,
	projects: mockProjects,
};

const fetchProjects = createAsyncThunk(
	"workspaces/fetchProjects",
	async (api: WorkspacesApi) => {
		try {
			return await api.getProjects();
		} catch {
			return mockProjects;
		}
	},
);

const fetchRecentDocuments = createAsyncThunk(
	"workspaces/fetchRecentDocuments",
	async (api: WorkspacesApi) => {
		try {
			return await api.getRecentDocuments();
		} catch {
			return mockDocuments;
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
				members: ["/avatars/avatar-5c4764.jpg"],
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
				state.projects = mockProjects;
			})
			.addCase(fetchRecentDocuments.fulfilled, (state, action) => {
				state.documents = action.payload;
			})
			.addCase(fetchRecentDocuments.rejected, (state) => {
				state.documents = mockDocuments;
			})
			.addCase(createProject.fulfilled, (state, action) => {
				state.projects.unshift(action.payload);
			})
			.addCase(createProject.rejected, (state, action) => {
				const { payload } = action.meta.arg;
				state.projects.unshift({
					description: payload.description ?? "",
					id: `proj-${String(Date.now())}`,
					members: ["/avatars/avatar-5c4764.jpg"],
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
