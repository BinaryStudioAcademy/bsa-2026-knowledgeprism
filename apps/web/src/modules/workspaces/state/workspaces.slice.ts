import {
	createAsyncThunk,
	createSlice,
	type PayloadAction,
} from "@reduxjs/toolkit";

import { logout } from "~/modules/auth/state/actions.js";

import { type WorkspacesApi } from "../api/workspaces-api.js";
import { type ProjectItem, type RecentDocumentItem } from "../types/types.js";
import { createProject, deleteProject, updateProject } from "./action.js";

const LAST_ACTIVE_PROJECT_STORAGE_KEY = "kp:lastActiveProjectId";

interface WorkspacesState {
	error: null | string;
	isCreating: boolean;
	isLoading: boolean;
	isLoadingRecent: boolean;
	isUpdating: boolean;
	lastActiveProjectId: null | string;
	projects: ProjectItem[];
	recentDocuments: RecentDocumentItem[];
}

const getStoredLastActiveProjectId = (): null | string => {
	try {
		return localStorage.getItem(LAST_ACTIVE_PROJECT_STORAGE_KEY);
	} catch {
		return null;
	}
};

const removeStoredLastActiveProjectId = (): void => {
	try {
		localStorage.removeItem(LAST_ACTIVE_PROJECT_STORAGE_KEY);
	} catch {
		// localStorage unavailable — non-fatal
	}
};

const clearLastActiveProjectIfMissing = (state: WorkspacesState): void => {
	const { lastActiveProjectId, projects } = state;
	const isProjectAvailable = projects.some(
		(project) => project.id === lastActiveProjectId,
	);

	if (!lastActiveProjectId || isProjectAvailable) {
		return;
	}

	state.lastActiveProjectId = null;
	removeStoredLastActiveProjectId();
};

const initialState: WorkspacesState = {
	error: null,
	isCreating: false,
	isLoading: false,
	isLoadingRecent: false,
	isUpdating: false,
	lastActiveProjectId: getStoredLastActiveProjectId(),
	projects: [],
	recentDocuments: [],
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

const getProjectLastActivityTimestamp = (project: ProjectItem): number => {
	return Date.parse(project.lastActivityAt ?? project.updatedAt);
};

const sortProjectsByLastActivityDesc = (
	projects: ProjectItem[],
): ProjectItem[] => {
	return projects.toSorted((firstProject, secondProject) => {
		return (
			getProjectLastActivityTimestamp(secondProject) -
			getProjectLastActivityTimestamp(firstProject)
		);
	});
};

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
				clearLastActiveProjectIfMissing(state);
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
			})
			.addCase(createProject.fulfilled, (state, action) => {
				state.isCreating = false;
				state.projects.unshift(action.payload);
			})
			.addCase(createProject.rejected, (state) => {
				state.isCreating = false;
			})
			.addCase(deleteProject.fulfilled, (state, action) => {
				state.projects = state.projects.filter(
					(project) => project.id !== action.payload,
				);
				clearLastActiveProjectIfMissing(state);
			})
			.addCase(updateProject.pending, (state) => {
				state.isUpdating = true;
			})
			.addCase(updateProject.fulfilled, (state, action) => {
				state.isUpdating = false;
				state.projects = sortProjectsByLastActivityDesc(
					state.projects.map((project) =>
						project.id === action.payload.id
							? {
									...project,
									...action.payload,
									lastActivityAt: action.payload.updatedAt,
									role: project.role,
								}
							: project,
					),
				);
			})
			.addCase(updateProject.rejected, (state) => {
				state.isUpdating = false;
			})
			.addCase(logout.fulfilled, (state) => {
				state.lastActiveProjectId = null;
				removeStoredLastActiveProjectId();
			});
	},
	initialState,
	name: "workspaces",
	reducers: {
		setLastActiveProject(state, action: PayloadAction<string>) {
			state.lastActiveProjectId = action.payload;
			try {
				localStorage.setItem(LAST_ACTIVE_PROJECT_STORAGE_KEY, action.payload);
			} catch {
				// localStorage unavailable — in-memory only, non-fatal
			}
		},
	},
});

const workspacesActions = workspacesSlice.actions;
const workspacesReducer = workspacesSlice.reducer;

export { createProject, deleteProject, updateProject } from "./action.js";
export {
	fetchProjects,
	fetchRecentDocuments,
	workspacesActions,
	workspacesReducer,
};
