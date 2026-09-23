import { useParams } from "react-router-dom";

import { useAppSelector } from "~/hooks/use-app-selector/use-app-selector.hook.js";

const useOptionalCurrentProjectId = (): string | undefined => {
	const { projectId } = useParams<{ projectId?: string }>();
	const lastActiveProjectId = useAppSelector(
		({ workspaces }) => workspaces.lastActiveProjectId,
	);

	return projectId ?? lastActiveProjectId ?? undefined;
};

const useCurrentProjectId = (): string => {
	const projectId = useOptionalCurrentProjectId();

	if (!projectId) {
		throw new Error(
			"useCurrentProjectId must be used within a project route or after visiting a project.",
		);
	}

	return projectId;
};

export { useCurrentProjectId, useOptionalCurrentProjectId };
