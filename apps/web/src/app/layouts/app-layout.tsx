import { useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";

import { RouterOutlet } from "~/components/components.js";
import { AppRoute } from "~/lib/enums/enums.js";
import { type AppDispatch, type RootState } from "~/lib/store/store.js";
import { actions as authActions } from "~/modules/auth/auth.js";
import { WorkspaceHeader } from "~/modules/workspaces/components/components.js";

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

	const userResponse = useSelector((state: RootState) => state.auth.user);
	const userDetails = userResponse?.user as undefined | UserWithRole;
	const isOrgAdmin = userResponse?.user.organisationRole === "ADMIN";

	const handleLogOut = useCallback((): void => {
		void dispatch(authActions.logout());
		void navigate(AppRoute.ROOT);
	}, [dispatch, navigate]);

	const handleOpenSettings = useCallback((): void => {
		void navigate(AppRoute.SETTINGS);
	}, [navigate]);

	return (
		<div className="flex h-dvh flex-col bg-bg">
			<WorkspaceHeader
				firstName={userDetails?.firstName ?? null}
				isAdmin={isOrgAdmin}
				lastName={userDetails?.lastName ?? null}
				onLogOut={handleLogOut}
				onOpenSettings={handleOpenSettings}
				organizationName={userResponse?.organisation.name ?? null}
			/>

			<main className="flex min-h-0 flex-1 flex-col">
				<RouterOutlet />
			</main>
		</div>
	);
};

export { AppLayout };
