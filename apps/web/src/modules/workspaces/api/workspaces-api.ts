import {
	type ProjectItem,
	type ProjectRole,
	type RecentDocumentItem,
} from "../types/types.js";

type CreateProjectPayload = {
	description?: string;
	name: string;
};

type ProjectListItemDto = {
	description: null | string;
	id: number;
	lastActivityAt: string;
	name: string;
	role: ProjectRole;
};

type ProjectResponseDto = {
	description: null | string;
	id: number;
	name: string;
	updatedAt: string;
};

type ProjectsResponse =
	| ProjectListItemDto[]
	| { items?: ProjectListItemDto[]; projects?: ProjectListItemDto[] };

type RecentDocumentsResponse = {
	items: RecentDocumentItem[];
};

type UpdateProjectPayload = {
	description?: string;
	id: string;
	name: string;
};

class WorkspacesApi {
	#baseUrl: string;

	public constructor({ baseUrl }: { baseUrl: string }) {
		this.#baseUrl = baseUrl;
	}

	private async parseError(response: Response): Promise<Error> {
		try {
			const body = (await response.json()) as { message?: string };
			return new Error(body.message ?? response.statusText);
		} catch {
			return new Error(response.statusText);
		}
	}

	public async createProject(
		payload: CreateProjectPayload,
	): Promise<ProjectItem> {
		const response = await fetch(`${this.#baseUrl}/projects`, {
			body: JSON.stringify(payload),
			headers: { "Content-Type": "application/json" },
			method: "POST",
		});

		if (!response.ok) {
			throw await this.parseError(response);
		}

		const dto = (await response.json()) as ProjectResponseDto;
		return mapProjectResponseToItem(dto, { role: "ADMIN" });
	}

	public async deleteProject(id: string): Promise<boolean> {
		try {
			const response = await fetch(`${this.#baseUrl}/projects/${id}`, {
				method: "DELETE",
			});

			return response.ok;
		} catch {
			return false;
		}
	}

	public async getProjects(): Promise<ProjectItem[]> {
		try {
			const response = await fetch(`${this.#baseUrl}/projects`, {
				headers: {
					"Content-Type": "application/json",
				},
			});

			if (!response.ok) {
				throw new Error(`Failed to fetch projects: ${response.statusText}`);
			}

			const data = (await response.json()) as ProjectsResponse;

			if (Array.isArray(data)) {
				return data.map((item) => mapProjectListItemToItem(item));
			}

			if ("items" in data && Array.isArray(data.items)) {
				return data.items.map((item) => mapProjectListItemToItem(item));
			}

			if ("projects" in data && Array.isArray(data.projects)) {
				return data.projects.map((item) => mapProjectListItemToItem(item));
			}

			return [];
		} catch {
			return [];
		}
	}

	public async getRecentDocuments(): Promise<RecentDocumentItem[]> {
		try {
			const response = await fetch(`${this.#baseUrl}/knowledge/recent`, {
				headers: {
					"Content-Type": "application/json",
				},
			});

			if (!response.ok) {
				throw new Error(
					`Failed to fetch recent documents: ${response.statusText}`,
				);
			}

			const data = (await response.json()) as unknown;

			if (
				data &&
				typeof data === "object" &&
				"items" in data &&
				Array.isArray((data as RecentDocumentsResponse).items)
			) {
				return (data as RecentDocumentsResponse).items;
			}

			return [];
		} catch {
			return [];
		}
	}

	public async updateProject(
		payload: UpdateProjectPayload,
	): Promise<ProjectItem> {
		const response = await fetch(`${this.#baseUrl}/projects/${payload.id}`, {
			body: JSON.stringify({
				description: payload.description,
				name: payload.name,
			}),
			headers: { "Content-Type": "application/json" },
			method: "PATCH",
		});

		if (!response.ok) {
			throw await this.parseError(response);
		}

		const dto = (await response.json()) as ProjectResponseDto;
		return mapProjectResponseToItem(dto, {});
	}
}

function mapProjectListItemToItem(dto: ProjectListItemDto): ProjectItem {
	return {
		description: dto.description,
		id: String(dto.id),
		lastActivityAt: dto.lastActivityAt,
		name: dto.name,
		role: dto.role,
		updatedAt: dto.lastActivityAt,
	};
}

function mapProjectResponseToItem(
	dto: ProjectResponseDto,
	context: { role?: ProjectRole },
): ProjectItem {
	return {
		description: dto.description,
		id: String(dto.id),
		lastActivityAt: dto.updatedAt,
		name: dto.name,
		role: context.role ?? "ADMIN",
		updatedAt: dto.updatedAt,
	};
}

export { type CreateProjectPayload, type UpdateProjectPayload, WorkspacesApi };
