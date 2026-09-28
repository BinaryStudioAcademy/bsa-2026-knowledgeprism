import { createAsyncThunk } from "@reduxjs/toolkit";

import { NotificationVariant } from "~/lib/enums/enums.js";
import { notificationService } from "~/lib/notifications/notification.service.js";
import { type AsyncThunkConfig } from "~/lib/types/types.js";

import {
	type CreateProjectPayload,
	type UpdateProjectPayload,
} from "../api/workspaces-api.js";
import { ProjectNotificationMessage } from "../libs/constants/project-notification-message.constant.js";
import { type ProjectItem } from "../types/types.js";

const createProject = createAsyncThunk<
	ProjectItem,
	CreateProjectPayload,
	AsyncThunkConfig
>("workspace/create-project", async (payload, { extra }) => {
	const { workspacesApi } = extra;

	const createdProject = await workspacesApi.createProject(payload);

	notificationService.notify({
		message: ProjectNotificationMessage.CREATED,
		variant: NotificationVariant.SUCCESS,
	});

	return createdProject;
});

const deleteProject = createAsyncThunk<string, string, AsyncThunkConfig>(
	"workspace/delete-project",
	async (id, { extra }) => {
		const { workspacesApi } = extra;
		const wasDeleted = await workspacesApi.deleteProject(id);

		if (!wasDeleted) {
			throw new Error("Failed to delete project");
		}

		notificationService.notify({
			message: ProjectNotificationMessage.DELETED,
			variant: NotificationVariant.SUCCESS,
		});

		return id;
	},
);

const updateProject = createAsyncThunk<
	ProjectItem,
	UpdateProjectPayload,
	AsyncThunkConfig
>("workspace/update-project", async (payload, { extra }) => {
	const { workspacesApi } = extra;

	const updatedProject = await workspacesApi.updateProject(payload);

	notificationService.notify({
		message: ProjectNotificationMessage.UPDATED,
		variant: NotificationVariant.SUCCESS,
	});

	return updatedProject;
});

export { createProject, deleteProject, updateProject };
