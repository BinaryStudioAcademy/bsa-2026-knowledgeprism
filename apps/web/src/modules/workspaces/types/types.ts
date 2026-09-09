type ProjectItem = {
	description?: string;
	id: string;
	members?: string[];
	name: string;
	role: ProjectRole;
	updatedAt: string;
};

type ProjectRole = "ADMIN" | "EDITOR" | "VIEWER";

export type { ProjectItem, ProjectRole };
