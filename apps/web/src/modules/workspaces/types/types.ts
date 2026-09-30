import { type ProjectMemberRole } from "@knowledgeprism/constants";

import { type ValueOf } from "~/lib/types/types.js";

type ProjectItem = {
	description: null | string;
	id: string;
	lastActivityAt?: string;
	members?: string[];
	name: string;
	role: ProjectRole;
	updatedAt: string;
};

type ProjectRole = ValueOf<typeof ProjectMemberRole>;

type RecentDocumentItem = {
	id: string;
	projectId: string;
	title: string;
	updatedAt: string;
};

type RoleFilter = "ALL" | ProjectRole;

export type { ProjectItem, ProjectRole, RecentDocumentItem, RoleFilter };
