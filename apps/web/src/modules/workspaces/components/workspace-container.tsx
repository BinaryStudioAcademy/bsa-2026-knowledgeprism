import { useCallback, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";

import { Alert, Loader } from "~/components/components.js";
import { AppRoute } from "~/lib/enums/enums.js";
import { type AppDispatch, type RootState } from "~/lib/store/store.js";
import {
	type CreateProjectPayload,
	type UpdateProjectPayload,
	WorkspacesApi,
} from "~/modules/workspaces/api/workspaces-api.js";
import {
	createProject,
	fetchProjects,
	updateProject,
} from "~/modules/workspaces/state/workspaces.slice.js";

import { WorkspacePage } from "./workspace-page.js";

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

	const {
		creationError,
		error,
		isCreating,
		isLoading,
		isUpdating,
		projects,
		updateError,
	} = useSelector((state: RootState) => state.workspaces);

	const userObject = userResponse?.user as undefined | UserWithRole;

	const firstName = userObject?.firstName ?? "";
	const isOrgAdmin = userObject?.isOrgAdmin ?? userObject?.role === "ADMIN";
	const lastName = userObject?.lastName ?? "";
	const organizationName = userResponse?.organisation.name ?? "";

	const handleFetchData = useCallback((): void => {
		void dispatch(fetchProjects(api));
	}, [dispatch]);

	const handleCreateProject = useCallback(
		(payload: CreateProjectPayload) => {
			return dispatch(createProject(payload));
		},
		[dispatch],
	);

	const handleEditProject = useCallback(
		(payload: UpdateProjectPayload) => {
			return dispatch(updateProject(payload));
		},
		[dispatch],
	);

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
						className="text-sm font-medium text-text-muted underline transition-colors hover:text-text"
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
			creationError={creationError}
			firstName={firstName}
			isCreating={isCreating}
			isLoading={isLoading}
			isOrgAdmin={isOrgAdmin}
			isUpdating={isUpdating}
			lastName={lastName}
			onCreateProject={handleCreateProject}
			onEditProject={handleEditProject}
			onLogOut={handleLogOut}
			onOpenSettings={handleOpenSettings}
			onSelectProject={handleSelectProject}
			organizationName={organizationName}
			projects={projects}
			updateError={updateError}
		/>
	);
};

export { WorkspaceContainer };
