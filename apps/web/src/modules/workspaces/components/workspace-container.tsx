import { useCallback, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";

import { Alert, Loader } from "~/components/components.js";
import { AppRoute } from "~/lib/enums/enums.js";
import { type AppDispatch, type RootState } from "~/lib/store/store.js";
import { WorkspacesApi } from "~/modules/workspaces/api/workspaces-api.js";
import { fetchProjects } from "~/modules/workspaces/state/workspaces.slice.js";

import { WorkspacePage } from "./components.js";

const api = new WorkspacesApi({ baseUrl: "/api" });
const EMPTY_LENGTH = 0;

type UserWithRole = {
	email: string;
	firstName: string;
	id: number;
	isOrgAdmin?: boolean;
	lastName: string;
	role?: string;
};

const WorkspaceContainer: React.FC = () => {
	const dispatch = useDispatch<AppDispatch>();
	const navigate = useNavigate();

	const userResponse = useSelector((state: RootState) => state.auth.user);

	const { error, isLoading, projects } = useSelector(
		(state: RootState) => state.workspaces,
	);

	const userObject = userResponse?.user as undefined | UserWithRole;

	const firstName = userObject?.firstName ?? "";
	const isOrgAdmin = userObject?.isOrgAdmin ?? userObject?.role === "ADMIN";
	const lastName = userObject?.lastName ?? "";
	const organizationName = userResponse?.organisation.name ?? "";

	const handleCreateProject = useCallback((): void => {}, []);

	const handleFetchData = useCallback((): void => {
		void dispatch(fetchProjects(api));
	}, [dispatch]);

	const handleLogOut = useCallback((): void => {
		void navigate(AppRoute.ROOT);
	}, [navigate]);

	const handleOpenSettings = useCallback((): void => {
		// TODO: Change destination for Admins once the Admin route is implemented
		void navigate(AppRoute.SETTINGS);
	}, [navigate]);

	const handleSelectProject = useCallback(
		(id: string): void => {
			void navigate(`${AppRoute.WORKSPACES}/${id}`);
		},
		[navigate],
	);

	useEffect(() => {
		handleFetchData();
	}, [handleFetchData]);

	if (isLoading && projects.length === EMPTY_LENGTH) {
		return (
			<div className="flex min-h-screen items-center justify-center bg-bg">
				<Loader size="lg" />
			</div>
		);
	}

	if (error) {
		return (
			<div className="flex min-h-screen items-center justify-center bg-bg p-4">
				<div className="flex max-w-md flex-col items-center gap-4">
					<Alert
						description={error}
						title="Data fetching error"
						variant="error"
					/>
					<button
						className="text-sm font-medium text-text-muted transition-colors hover:text-text underline"
						onClick={handleFetchData}
						type="button"
					>
						Try again
					</button>
				</div>
			</div>
		);
	}

	return (
		<WorkspacePage
			firstName={firstName}
			isLoading={isLoading}
			isOrgAdmin={isOrgAdmin}
			lastName={lastName}
			onCreateProject={handleCreateProject}
			onLogOut={handleLogOut}
			onOpenSettings={handleOpenSettings}
			onSelectProject={handleSelectProject}
			organizationName={organizationName}
			projects={projects}
		/>
	);
};

export { WorkspaceContainer };
