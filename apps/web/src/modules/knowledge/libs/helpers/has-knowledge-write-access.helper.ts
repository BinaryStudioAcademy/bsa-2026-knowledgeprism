import { ProjectMemberRole } from "@knowledgeprism/constants";

const KNOWLEDGE_WRITE_ROLES = new Set<string>([
	ProjectMemberRole.ADMIN,
	ProjectMemberRole.EDITOR,
]);

const hasKnowledgeWriteAccess = (role: null | string | undefined): boolean => {
	return KNOWLEDGE_WRITE_ROLES.has(role?.trim().toUpperCase() ?? "");
};

export { hasKnowledgeWriteAccess };
