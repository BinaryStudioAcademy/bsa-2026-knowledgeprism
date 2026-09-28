import { OrganisationRole } from "@knowledgeprism/constants";
import { useEffect } from "react";
import { useParams } from "react-router-dom";

import { MobileNav, RouterOutlet, Sidebar } from "~/components/components.js";
import {
	useAppDispatch,
	useAppSelector,
	useOptionalCurrentProjectId,
} from "~/hooks/hooks.js";
import {
	fetchProjects,
	workspacesActions,
} from "~/modules/workspaces/state/workspaces.slice.js";
import { workspacesApi } from "~/modules/workspaces/workspaces.js";

const EMPTY_LENGTH = 0;

const SidebarLayout: React.FC = () => {
	const { projectId: urlProjectId } = useParams<{ projectId?: string }>();
	const effectiveProjectId = useOptionalCurrentProjectId();
	const dispatch = useAppDispatch();
	const { projects } = useAppSelector(({ workspaces }) => workspaces);
	const { user } = useAppSelector(({ auth }) => auth);

	useEffect(() => {
		if (projects.length === EMPTY_LENGTH) {
			void dispatch(fetchProjects(workspacesApi));
		}
	}, [dispatch, projects.length]);

	useEffect(() => {
		if (urlProjectId) {
			dispatch(workspacesActions.setLastActiveProject(urlProjectId));
		}
	}, [dispatch, urlProjectId]);

	const currentProject = projects.find(
		(project) => project.id === effectiveProjectId,
	);

	const hasProjects = projects.length > EMPTY_LENGTH;
	const isAdmin = user?.user.organisationRole === OrganisationRole.ADMIN;
	const shouldRenderSidebar = hasProjects || isAdmin;

	return (
		<div className="flex h-full min-h-0 flex-col overflow-hidden tablet:flex-row">
			{shouldRenderSidebar && (
				<Sidebar
					isAdmin={isAdmin}
					projectName={currentProject?.name ?? ""}
					role={currentProject?.role ?? ""}
				/>
			)}

			<div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-y-auto">
				<RouterOutlet />
			</div>

			{shouldRenderSidebar && <MobileNav />}
		</div>
	);
};

export { SidebarLayout };
