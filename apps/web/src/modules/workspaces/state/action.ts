import { createAsyncThunk } from "@reduxjs/toolkit";

import { type AsyncThunkConfig } from "~/lib/types/types.js";

import {
	type CreateProjectPayload,
	type UpdateProjectPayload,
} from "../api/workspaces-api.js";
import { type ProjectItem } from "../types/types.js";

const createProject = createAsyncThunk<
	ProjectItem,
	CreateProjectPayload,
	AsyncThunkConfig
>("workspace/create-project", (payload, { extra }) => {
	const { workspacesApi } = extra;

	return workspacesApi.createProject(payload);
});

const deleteProject = createAsyncThunk<string, string, AsyncThunkConfig>(
	"workspace/delete-project",
	async (id, { extra }) => {
		const { workspacesApi } = extra;
		const wasDeleted = await workspacesApi.deleteProject(id);

		if (!wasDeleted) {
			throw new Error("Failed to delete project");
		}

		return id;
	},
);

const updateProject = createAsyncThunk<
	ProjectItem,
	UpdateProjectPayload,
	AsyncThunkConfig
>("workspace/update-project", (payload, { extra }) => {
	const { workspacesApi } = extra;

	return workspacesApi.updateProject(payload);
});

export { createProject, deleteProject, updateProject };
