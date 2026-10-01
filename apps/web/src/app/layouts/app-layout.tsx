import { OrganisationRole } from "@knowledgeprism/constants";
import { useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";

import { RouterOutlet } from "~/components/components.js";
import { useShellSidebar } from "~/components/sidebar/libs/use-shell-sidebar.hook.js";
import { AppRoute } from "~/lib/enums/enums.js";
import { type AppDispatch, type RootState } from "~/lib/store/store.js";
import { actions as authActions } from "~/modules/auth/auth.js";
import { WorkspaceHeader } from "~/modules/workspaces/components/components.js";

import { AppSidebarOverlayContext } from "./app-sidebar-overlay-context.js";

type UserWithRole = {
	email: string;
	firstName: string;
	id: number;
	lastName: string;
	organisationRole?: string;
	role?: string;
};

const AppLayout: React.FC = () => {
	const dispatch = useDispatch<AppDispatch>();
	const navigate = useNavigate();
	const shell = useShellSidebar();

	const userResponse = useSelector((state: RootState) => state.auth.user);
	const userDetails = userResponse?.user as undefined | UserWithRole;
	const isOrgAdmin =
		userResponse?.user.organisationRole === OrganisationRole.ADMIN;

	const handleLogOut = useCallback((): void => {
		void (async (): Promise<void> => {
			try {
				await dispatch(authActions.logout()).unwrap();
			} finally {
				void navigate(AppRoute.ROOT);
			}
		})();
	}, [dispatch, navigate]);

	const handleOpenSettings = useCallback((): void => {
		void navigate(AppRoute.SETTINGS);
	}, [navigate]);

	return (
		<AppSidebarOverlayContext.Provider value={shell}>
			<div className="flex h-dvh flex-col bg-bg">
				<WorkspaceHeader
					firstName={userDetails?.firstName ?? null}
					isAdmin={isOrgAdmin}
					lastName={userDetails?.lastName ?? null}
					onDropdownOpen={shell.closeOverlay}
					onLogOut={handleLogOut}
					onOpenSettings={handleOpenSettings}
					organizationName={userResponse?.organisation.name ?? null}
				/>

				<main className="flex min-h-0 flex-1 flex-col">
					<RouterOutlet />
				</main>
			</div>
		</AppSidebarOverlayContext.Provider>
	);
};

export { AppLayout };
