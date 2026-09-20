import { type ProjectItem, type RecentDocumentItem } from "../types/types.js";

type CreateProjectPayload = {
	description?: string;
	name: string;
};

type ProjectsResponse =
	ProjectItem[] | { items?: ProjectItem[]; projects?: ProjectItem[] };

type RecentDocumentsResponse = {
	items: RecentDocumentItem[];
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
			const response = await fetch(`${this.#baseUrl}/projects`, {
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
				return data;
			}

			if ("items" in data && Array.isArray(data.items)) {
				return data.items;
			}

			if ("projects" in data && Array.isArray(data.projects)) {
				return data.projects;
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
}

export { type CreateProjectPayload, WorkspacesApi };
