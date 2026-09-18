import { useCallback, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";

import { Alert, Loader } from "~/components/components.js";
import { AppRoute } from "~/lib/enums/enums.js";
import { type AppDispatch, type RootState } from "~/lib/store/store.js";
import {
	type CreateProjectPayload,
	type UpdateProjectPayload,
} from "~/modules/workspaces/api/workspaces-api.js";
import {
	createProject,
	fetchProjects,
	fetchRecentDocuments,
	updateProject,
} from "~/modules/workspaces/state/workspaces.slice.js";
import { workspacesApi } from "~/modules/workspaces/workspaces.js";

import { WorkspacePage } from "./workspace-page.js";

const EMPTY_LENGTH = 0;

type UserWithRole = {
	organisationRole?: "ADMIN" | "USER";
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
		isLoadingRecent,
		isUpdating,
		projects,
		recentDocuments,
		updateError,
	} = useSelector((state: RootState) => state.workspaces);

	const userObject = userResponse?.user as undefined | UserWithRole;
	const isOrgAdmin = userObject?.organisationRole === "ADMIN";

	const handleFetchData = useCallback((): void => {
		void dispatch(fetchProjects(workspacesApi));
		void dispatch(fetchRecentDocuments(workspacesApi));
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
			isCreating={isCreating}
			isLoadingRecent={isLoadingRecent}
			isOrgAdmin={isOrgAdmin}
			isUpdating={isUpdating}
			onCreateProject={handleCreateProject}
			onEditProject={handleEditProject}
			onSelectProject={handleSelectProject}
			projects={projects}
			recentDocuments={recentDocuments}
			updateError={updateError}
		/>
	);
};

export { WorkspaceContainer };
