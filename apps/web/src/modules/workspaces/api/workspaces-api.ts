import {
	MOCK_DOCUMENTS,
	MOCK_PROJECTS,
} from "../libs/constants/mock-data.constants.js";
import {
	type DocumentItem,
	type ProjectItem,
	ProjectRole,
} from "../types/types.js";

type CreateProjectPayload = {
	description?: string;
	name: string;
};
type ProjectResponseDto = {
	description: null | string;
	id: number;
	name: string;
	updatedAt: string;
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
		try {
			const response = await fetch(`${this.#baseUrl}/workspaces/projects`, {
				body: JSON.stringify(payload),
				headers: { "Content-Type": "application/json" },
				method: "POST",
			});

			if (!response.ok) {
				throw await this.parseError(response);
			}

			const dto = (await response.json()) as ProjectResponseDto;
			return mapProjectResponseToItem(dto, { members: [], role: "ADMIN" });
		} catch (error) {
			throw error instanceof Error
				? error
				: new Error("Failed to create project");
		}
	}
	public async getProjects(): Promise<ProjectItem[]> {
		try {
			const response = await fetch(`${this.#baseUrl}/workspaces/projects`, {
				headers: {
					"Content-Type": "application/json",
				},
			});

			if (!response.ok) {
				throw new Error(`Failed to fetch projects: ${response.statusText}`);
			}

			const data = (await response.json()) as unknown;
			if (!Array.isArray(data)) {
				throw new TypeError("Invalid response format");
			}

			return data as ProjectItem[];
		} catch {
			return MOCK_PROJECTS;
		}
	}

	public async getRecentDocuments(): Promise<DocumentItem[]> {
		try {
			const response = await fetch(
				`${this.#baseUrl}/workspaces/documents/recent`,
				{
					headers: {
						"Content-Type": "application/json",
					},
				},
			);

			if (!response.ok) {
				throw new Error(
					`Failed to fetch recent documents: ${response.statusText}`,
				);
			}

			const data = (await response.json()) as unknown;
			if (!Array.isArray(data)) {
				throw new TypeError("Invalid response format");
			}

			return data as DocumentItem[];
		} catch {
			return MOCK_DOCUMENTS;
		}
	}

	public async updateProject(
		payload: UpdateProjectPayload,
	): Promise<ProjectItem> {
		try {
			const response = await fetch(
				`${this.#baseUrl}/workspaces/projects/${payload.id}`,
				{
					body: JSON.stringify({
						description: payload.description,
						name: payload.name,
					}),
					headers: { "Content-Type": "application/json" },
					method: "PATCH",
				},
			);

			if (!response.ok) {
				throw await this.parseError(response);
			}

			const dto = (await response.json()) as ProjectResponseDto;
			return mapProjectResponseToItem(dto, {});
		} catch (error) {
			throw error instanceof Error
				? error
				: new Error("Failed to update project");
		}
	}

	// public async updateProject(
	// 	payload: UpdateProjectPayload,
	// ): Promise<ProjectItem> {
	// 	try {
	// 		const response = await fetch(
	// 			`${this.#baseUrl}/workspaces/projects/${payload.id}`,
	// 			{
	// 				body: JSON.stringify({
	// 					description: payload.description,
	// 					name: payload.name,
	// 				}),
	// 				headers: { "Content-Type": "application/json" },
	// 				method: "PATCH",
	// 			},
	// 		);
	// 		if (!response.ok) {
	// 			throw new Error(`Failed to update project: ${response.statusText}`);
	// 		}
	// 		return (await response.json()) as ProjectItem;
	// 	} catch {
	// 		return {
	// 			description: payload.description ?? "",
	// 			id: payload.id,
	// 			name: payload.name,
	// 		} as ProjectItem;
	// 	}
	// }
}

function mapProjectResponseToItem(
	dto: ProjectResponseDto,
	context: { members?: string[]; role?: ProjectRole },
): ProjectItem {
	return {
		description: dto.description ?? "",
		id: String(dto.id),
		members: context.members ?? [],
		name: dto.name,
		role: context.role ?? "ADMIN",
		updatedAt: dto.updatedAt,
	};
}

export { type CreateProjectPayload, UpdateProjectPayload, WorkspacesApi };
