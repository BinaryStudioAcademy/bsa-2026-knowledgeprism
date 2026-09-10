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

const updateProject = createAsyncThunk<
	ProjectItem,
	UpdateProjectPayload,
	AsyncThunkConfig
>("workspace/update-project", (payload, { extra }) => {
	const { workspacesApi } = extra;

	return workspacesApi.updateProject(payload);
});

export { createProject, updateProject };
