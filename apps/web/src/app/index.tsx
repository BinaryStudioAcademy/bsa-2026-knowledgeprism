import { StrictMode, useCallback, useEffect } from "react";
import { createRoot } from "react-dom/client";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";

import { Loader, StoreProvider } from "~/components/components.js";
import { AppRoute } from "~/lib/enums/enums.js";
import { type AppDispatch, type RootState, store } from "~/lib/store/store.js";
import { AuthPage } from "~/modules/auth/components/auth-page.js";
import { NotFoundPage } from "~/modules/not-found/components/not-found-page.js";
import { AccountSettingsPage } from "~/modules/users/components/components.js";
import {
	CreateProjectPayload,
	UpdateProjectPayload,
	WorkspacesApi,
} from "~/modules/workspaces/api/workspaces-api.js";
import {
	ProjectDetailsPage,
	WorkspacePage,
} from "~/modules/workspaces/components/components.js";
import {
	createProject,
	fetchProjects,
	fetchRecentDocuments,
	updateProject,
} from "~/modules/workspaces/state/workspaces.slice.js";
import "~/styles/styles.css";

import { App } from "./app.js";
import { AppLayout } from "./layouts/app-layout.js";
import { AuthLayout } from "./layouts/auth-layout.js";
import { PublicLayout } from "./layouts/public-layout.js";
import { SidebarLayout } from "./layouts/sidebar-layout.js";
import { RouterProvider } from "./router-provider.js";

type LocalAuthState = {
	auth?: {
		user?: {
			firstName?: string;
			isOrgAdmin?: boolean;
			lastName?: string;
			role?: string;
		};
	};
};

const api = new WorkspacesApi({ baseUrl: "/api" });

const WorkspaceContainer = () => {
	const dispatch = useDispatch<AppDispatch>();
	const navigate = useNavigate();

	const user = useSelector(
		(state: RootState) => (state as unknown as LocalAuthState).auth?.user,
	);

	const { documents, error, isLoading, projects } = useSelector(
		(state: RootState) => state.workspaces,
	);

	const handleFetchData = useCallback(() => {
		void dispatch(fetchProjects(api));
		void dispatch(fetchRecentDocuments(api));
	}, [dispatch]);

	useEffect(() => {
		handleFetchData();
	}, [handleFetchData]);

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
	const handleLogOut = useCallback(() => {
		// TODO: Implement user logout logic
	}, []);
	const handleOpenSettings = useCallback(() => {
		// TODO: Implement settings navigation
	}, []);
	const handleSelectDocument = useCallback(() => {
		// TODO: Implement document selection logic
	}, []);
	const handleSelectProject = useCallback(
		(id: string) => {
			void navigate(`${AppRoute.WORKSPACES}/${id}`);
		},
		[navigate],
	);

	if (isLoading) {
		return (
			<div className="flex items-center justify-center min-h-screen">
				<div className="text-center">
					<Loader />
				</div>
			</div>
		);
	}

	if (error) {
		return (
			<div className="flex items-center justify-center min-h-screen">
				<div className="p-6 text-center rounded-lg border border-error-disabled bg-error-bg">
					<p className="text-sm font-medium text-error">
						Data fetching error: {error}
					</p>
					<button
						className="mt-4 text-xs font-semibold text-error hover:text-error-hover underline cursor-pointer"
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
			documents={documents}
			firstName={user?.firstName ?? ""}
			isOrgAdmin={user?.isOrgAdmin || user?.role === "ADMIN"}
			lastName={user?.lastName ?? ""}
			onCreateProject={handleCreateProject}
			onEditProject={handleEditProject}
			onLogOut={handleLogOut}
			onOpenSettings={handleOpenSettings}
			onSelectDocument={handleSelectDocument}
			onSelectProject={handleSelectProject}
			organizationName="KnowledgePrism"
			projects={projects}
		/>
	);
};

createRoot(document.querySelector("#root") as HTMLElement).render(
	<StrictMode>
		<StoreProvider store={store.instance}>
			<RouterProvider
				routes={[
					{
						children: [
							{
								element: <App />,
								path: AppRoute.ROOT,
							},
						],
						element: <PublicLayout />,
					},
					{
						children: [
							{
								element: <AuthPage />,
								path: AppRoute.SIGN_IN,
							},
							{
								element: <AuthPage />,
								path: AppRoute.SIGN_UP,
							},
							{
								element: <WorkspaceContainer />,
								path: AppRoute.WORKSPACES,
							},
							{
								element: <ProjectDetailsPage />,
								path: AppRoute.WORKSPACE_DETAILS,
							},
						],
						element: <AuthLayout />,
					},
					{
						children: [
							{
								children: [
									{
										element: <AccountSettingsPage />,
										path: AppRoute.SETTINGS,
									},
								],
								element: <SidebarLayout />,
							},
						],
						element: <AppLayout />,
					},
					{
						element: <NotFoundPage />,
						path: "*",
					},
				]}
			/>
		</StoreProvider>
	</StrictMode>,
);
