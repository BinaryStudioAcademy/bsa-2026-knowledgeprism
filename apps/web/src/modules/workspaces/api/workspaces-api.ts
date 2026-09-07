import {
	MOCK_DOCUMENTS,
	MOCK_PROJECTS,
} from "../libs/constants/mock-data.constants.js";
import { type DocumentItem, type ProjectItem } from "../types/types.js";

type CreateProjectPayload = {
	description?: string;
	name: string;
};

class WorkspacesApi {
	#baseUrl: string;

	public constructor({ baseUrl }: { baseUrl: string }) {
		this.#baseUrl = baseUrl;
	}

	public async createProject(
		payload: CreateProjectPayload,
	): Promise<ProjectItem> {
		try {
			const response = await fetch(`${this.#baseUrl}/workspaces/projects`, {
				body: JSON.stringify(payload),
				headers: {
					"Content-Type": "application/json",
				},
				method: "POST",
			});

			if (!response.ok) {
				throw new Error(`Failed to create project: ${response.statusText}`);
			}

			const data = (await response.json()) as unknown;
			if (!data || typeof data !== "object") {
				throw new Error("Invalid response format");
			}

			return data as ProjectItem;
		} catch {
			return {
				description: payload.description ?? "",
				id: String(Date.now()),
				name: payload.name,
			} as ProjectItem;
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
}

export { type CreateProjectPayload, WorkspacesApi };
