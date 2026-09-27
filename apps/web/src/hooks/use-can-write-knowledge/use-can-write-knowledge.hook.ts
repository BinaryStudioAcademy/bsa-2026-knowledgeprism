import { ProjectMemberRole } from "@knowledgeprism/constants";

import { useAppSelector } from "~/hooks/use-app-selector/use-app-selector.hook.js";
import { useOptionalCurrentProjectId } from "~/hooks/use-current-project-id/use-current-project-id.hook.js";

const KNOWLEDGE_WRITER_ROLES: ReadonlySet<string> = new Set([
	ProjectMemberRole.ADMIN,
	ProjectMemberRole.EDITOR,
]);

const useCanWriteKnowledge = (): boolean => {
	const projectId = useOptionalCurrentProjectId();
	const role = useAppSelector(({ workspaces }) => {
		return workspaces.projects.find((project) => project.id === projectId)
			?.role;
	});

	return Boolean(role && KNOWLEDGE_WRITER_ROLES.has(role));
};

export { useCanWriteKnowledge };
