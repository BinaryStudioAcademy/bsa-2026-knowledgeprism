type DocumentItem = {
	id: string;
	title: string;
	updatedAt: string;
};

type ProjectItem = {
	description?: string;
	id: string;
	members?: string[];
	name: string;
	role: ProjectRole;
	updatedAt: string;
};

type ProjectRole = "ADMIN" | "EDITOR" | "VIEWER";

export type { DocumentItem, ProjectItem, ProjectRole };
