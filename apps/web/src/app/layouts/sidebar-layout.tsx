import { OrganisationRole } from "@knowledgeprism/constants";
import { useEffect } from "react";
import { useLocation, useParams } from "react-router-dom";

import { MobileNav, RouterOutlet, Sidebar } from "~/components/components.js";
import {
	useAppDispatch,
	useAppSelector,
	useCanWriteKnowledge,
	useOptionalCurrentProjectId,
} from "~/hooks/hooks.js";
import { AppRoute } from "~/lib/enums/enums.js";
import { getValidClassNames } from "~/lib/helpers/helpers.js";
import { useProjectKnowledgePipeline } from "~/modules/knowledge/libs/hooks/use-project-knowledge-pipeline.hook.js";
import {
	getUserManagementProjectId,
	isUserManagementPath,
} from "~/modules/users/libs/helpers/user-management-project.helper.js";
import {
	fetchProjects,
	workspacesActions,
} from "~/modules/workspaces/state/workspaces.slice.js";
import { workspacesApi } from "~/modules/workspaces/workspaces.js";

import { useAppSidebarOverlay } from "./app-sidebar-overlay-context.js";
import { KnowledgeTreePanelProvider } from "./knowledge-tree-panel-context.js";

const EMPTY_LENGTH = 0;

const SidebarLayout: React.FC = () => {
	const { projectId: urlProjectId } = useParams<{ projectId?: string }>();
	const effectiveProjectId = useOptionalCurrentProjectId();
	const dispatch = useAppDispatch();
	const { projects } = useAppSelector(({ workspaces }) => workspaces);
	const { user } = useAppSelector(({ auth }) => auth);
	const shell = useAppSidebarOverlay();

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

	const canWriteKnowledge = useCanWriteKnowledge();

	useProjectKnowledgePipeline({
		canEdit: canWriteKnowledge,
		projectId: effectiveProjectId,
	});

	const { pathname, search } = useLocation();
	const hasProjects = projects.length > EMPTY_LENGTH;
	const isAdmin = user?.user.organisationRole === OrganisationRole.ADMIN;
	const isOrganisationUserManagement =
		isUserManagementPath(pathname) &&
		getUserManagementProjectId(search) === null;
	const isAccountSettings = pathname === AppRoute.SETTINGS;
	const shouldRenderSidebar =
		(hasProjects || isAdmin) &&
		!isOrganisationUserManagement &&
		!isAccountSettings;
	const isPhone = shell.mode === "phone";
	const shouldShowSidebar =
		shouldRenderSidebar && (!isPhone || shell.isOverlayOpen);
	const shouldShowMobileNav =
		shouldRenderSidebar && isPhone && Boolean(effectiveProjectId);

	return (
		<KnowledgeTreePanelProvider>
			<div className="flex h-full min-h-0 flex-col">
				<div
					className={getValidClassNames(
						"relative flex min-h-0 flex-1 flex-col overflow-hidden",
						!isPhone && "flex-row",
					)}
				>
					{shouldRenderSidebar && shell.isOverlayOpen && (
						<button
							aria-label="Close sidebar"
							className="absolute inset-0 z-40 cursor-default border-0 bg-primary/30"
							onClick={shell.dismissOverlay}
							tabIndex={-1}
							type="button"
						/>
					)}

					{shouldShowSidebar && (
						<Sidebar
							isAdmin={isAdmin}
							projectName={currentProject?.name ?? ""}
							role={currentProject?.role ?? ""}
							shell={shell}
						/>
					)}

					<div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-y-auto">
						<RouterOutlet />
					</div>
				</div>

				{shouldShowMobileNav && (
					<MobileNav
						isAdmin={isAdmin}
						projectName={currentProject?.name ?? ""}
						role={currentProject?.role ?? ""}
					/>
				)}
			</div>
		</KnowledgeTreePanelProvider>
	);
};

export { SidebarLayout };
