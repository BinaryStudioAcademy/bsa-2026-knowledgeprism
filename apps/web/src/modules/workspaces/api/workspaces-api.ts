import {
	APIPath,
	KnowledgeApiPath,
	ProjectMemberRole,
	ProjectsApiPath,
} from "@knowledgeprism/constants";
import {
	type KnowledgeRecentResponseDto,
	type ProjectCreateRequestDto,
	type ProjectGetAllItemResponseDto,
	type ProjectGetAllResponseDto,
	type ProjectResponseDto,
	type ProjectUpdateRequestDto,
} from "@knowledgeprism/types";

import { BaseHTTPApi } from "~/api/api.js";
import { ContentType } from "~/lib/enums/enums.js";
import { type HTTP } from "~/lib/http/http.js";
import { type Storage } from "~/lib/storage/storage.js";

import { type ProjectItem, type RecentDocumentItem } from "../types/types.js";

type Constructor = {
	baseUrl: string;
	http: HTTP;
	storage: Storage;
};

type CreateProjectPayload = ProjectCreateRequestDto;

type UpdateProjectPayload = ProjectUpdateRequestDto & {
	id: string;
};

// This client spans /projects and /knowledge, so each endpoint carries its own APIPath.
const NO_SHARED_PATH = "";

const mapProjectListItemToItem = (
	dto: ProjectGetAllItemResponseDto,
): ProjectItem => ({
	description: dto.description,
	id: String(dto.id),
	lastActivityAt: dto.lastActivityAt,
	name: dto.name,
	role: dto.role,
	updatedAt: dto.lastActivityAt,
});

// Only organisation admins can create or edit projects, so the caller is always an admin.
const mapAdminProjectResponseToItem = (
	dto: ProjectResponseDto,
): ProjectItem => ({
	description: dto.description,
	id: String(dto.id),
	lastActivityAt: dto.updatedAt,
	name: dto.name,
	role: ProjectMemberRole.ADMIN,
	updatedAt: dto.updatedAt,
});

class WorkspacesApi extends BaseHTTPApi {
	public constructor({ baseUrl, http, storage }: Constructor) {
		super({ baseUrl, http, path: NO_SHARED_PATH, storage });
	}

	public async createProject(
		payload: CreateProjectPayload,
	): Promise<ProjectItem> {
		const response = await this.load(
			this.getFullEndpoint(APIPath.PROJECTS, ProjectsApiPath.ROOT, {}),
			{
				contentType: ContentType.JSON,
				hasAuth: true,
				method: "POST",
				payload: JSON.stringify(payload),
			},
		);

		return mapAdminProjectResponseToItem(
			await response.json<ProjectResponseDto>(),
		);
	}

	public async deleteProject(id: string): Promise<void> {
		await this.load(
			this.getFullEndpoint(APIPath.PROJECTS, ProjectsApiPath.ID, { id }),
			{
				contentType: ContentType.JSON,
				hasAuth: true,
				method: "DELETE",
				// Fastify rejects a JSON content type with an empty body.
				payload: JSON.stringify({}),
			},
		);
	}

	public async getProjects(): Promise<ProjectItem[]> {
		const response = await this.load(
			this.getFullEndpoint(APIPath.PROJECTS, ProjectsApiPath.ROOT, {}),
			{
				contentType: ContentType.JSON,
				hasAuth: true,
				method: "GET",
			},
		);

		const { items } = await response.json<ProjectGetAllResponseDto>();

		return items.map((item) => mapProjectListItemToItem(item));
	}

	public async getRecentDocuments(): Promise<RecentDocumentItem[]> {
		const response = await this.load(
			this.getFullEndpoint(APIPath.KNOWLEDGE, KnowledgeApiPath.RECENT, {}),
			{
				contentType: ContentType.JSON,
				hasAuth: true,
				method: "GET",
			},
		);

		const { items } = await response.json<KnowledgeRecentResponseDto>();

		return items.map((item) => ({
			id: String(item.id),
			projectId: String(item.projectId),
			title: item.title,
			updatedAt: item.updatedAt,
		}));
	}

	public async updateProject({
		id,
		...payload
	}: UpdateProjectPayload): Promise<ProjectItem> {
		const response = await this.load(
			this.getFullEndpoint(APIPath.PROJECTS, ProjectsApiPath.ID, { id }),
			{
				contentType: ContentType.JSON,
				hasAuth: true,
				method: "PATCH",
				payload: JSON.stringify(payload),
			},
		);

		return mapAdminProjectResponseToItem(
			await response.json<ProjectResponseDto>(),
		);
	}
}

export { type CreateProjectPayload, type UpdateProjectPayload, WorkspacesApi };
