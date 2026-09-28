import { OrganisationRole } from "@knowledgeprism/constants";
import { useEffect, useMemo } from "react";
import { useParams } from "react-router-dom";

import { MobileNav, RouterOutlet, Sidebar } from "~/components/components.js";
import { Icon } from "~/components/icon/icon.js";
import {
	APP_SIDEBAR_ID,
	CHEVRON_ICON_SIZE,
	EXPAND_SIDEBAR_LABEL,
} from "~/components/sidebar/libs/constants.js";
import { useShellSidebar } from "~/components/sidebar/libs/use-shell-sidebar.hook.js";
import {
	useAppDispatch,
	useAppSelector,
	useCanWriteKnowledge,
	useOptionalCurrentProjectId,
} from "~/hooks/hooks.js";
import { getValidClassNames } from "~/lib/helpers/helpers.js";
import { useProjectKnowledgePipeline } from "~/modules/knowledge/libs/hooks/use-project-knowledge-pipeline.hook.js";
import {
	fetchProjects,
	workspacesActions,
} from "~/modules/workspaces/state/workspaces.slice.js";
import { workspacesApi } from "~/modules/workspaces/workspaces.js";

import { AppSidebarOverlayContext } from "./app-sidebar-overlay-context.js";

const EMPTY_LENGTH = 0;

const SidebarLayout: React.FC = () => {
	const { projectId: urlProjectId } = useParams<{ projectId?: string }>();
	const effectiveProjectId = useOptionalCurrentProjectId();
	const dispatch = useAppDispatch();
	const { projects } = useAppSelector(({ workspaces }) => workspaces);
	const { user } = useAppSelector(({ auth }) => auth);
	const shell = useShellSidebar();

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

	const hasProjects = projects.length > EMPTY_LENGTH;
	const isAdmin = user?.user.organisationRole === OrganisationRole.ADMIN;
	const shouldRenderSidebar = hasProjects || isAdmin;
	const isPhone = shell.mode === "phone";
	const shouldShowSidebar =
		shouldRenderSidebar && (!isPhone || shell.isOverlayOpen);
	const shouldShowPhoneLauncher =
		shouldRenderSidebar && isPhone && !shell.isOverlayOpen;
	const shouldShowMobileNav = shouldRenderSidebar && isPhone;
	const overlayContextValue = useMemo(
		() => ({
			closeOverlay: shell.closeOverlay,
			isOverlayOpen: shell.isOverlayOpen,
		}),
		[shell.closeOverlay, shell.isOverlayOpen],
	);

	return (
		<AppSidebarOverlayContext.Provider value={overlayContextValue}>
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

					{shouldShowPhoneLauncher && (
						<button
							aria-controls={APP_SIDEBAR_ID}
							aria-expanded={false}
							aria-label={EXPAND_SIDEBAR_LABEL}
							className="absolute top-1/2 left-2 z-30 flex size-8 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full border border-border bg-surface text-text-muted shadow-sm hover:text-text focus-visible:ring-3 focus-visible:ring-accent/35 focus-visible:outline-none"
							onClick={shell.toggleSidebar}
							type="button"
						>
							<Icon name="chevron-filled-right" size={CHEVRON_ICON_SIZE} />
						</button>
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

				{shouldShowMobileNav && <MobileNav />}
			</div>
		</AppSidebarOverlayContext.Provider>
	);
};

export { SidebarLayout };
