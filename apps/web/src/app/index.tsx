import { StrictMode, useCallback, useEffect } from "react";
import { createRoot } from "react-dom/client";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";

import { Loader, StoreProvider } from "~/components/components.js";
import { AppRoute } from "~/lib/enums/enums.js";
import { type AppDispatch, type RootState, store } from "~/lib/store/store.js";
import { AuthPage } from "~/modules/auth/components/auth-page.js";
import { LandingPage } from "~/modules/landing/components/landing-page.js";
import { NotFoundPage } from "~/modules/not-found/components/not-found-page.js";
import { AccountSettingsPage } from "~/modules/users/components/components.js";
import { WorkspacesApi } from "~/modules/workspaces/api/workspaces-api.js";
import {
	ProjectDetailsPage,
	WorkspacePage,
} from "~/modules/workspaces/components/components.js";
import { fetchProjects } from "~/modules/workspaces/state/workspaces.slice.js";
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
			organizationName?: string;
			role?: string;
		};
	};
};

const api = new WorkspacesApi({ baseUrl: "/api" });

const WorkspaceContainer: React.FC = () => {
	const dispatch = useDispatch<AppDispatch>();
	const navigate = useNavigate();

	const user = useSelector(
		(state: RootState) => (state as unknown as LocalAuthState).auth?.user,
	);

	const { error, isLoading, projects } = useSelector(
		(state: RootState) => state.workspaces,
	);

	const isOrgAdmin = user?.isOrgAdmin ?? user?.role === "ADMIN";

	const handleCreateProject = useCallback((): void => {
		// TODO: Implement create project modal trigger
	}, []);

	const handleFetchData = useCallback((): void => {
		void dispatch(fetchProjects(api));
	}, [dispatch]);

	const handleLogOut = useCallback((): void => {
		// TODO: Implement user logout logic
		void navigate(AppRoute.ROOT);
	}, [navigate]);

	const handleOpenSettings = useCallback((): void => {
		// TODO: Redirect to ADMIN_SETTINGS route once it is added to AppRoute enum
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

	if (isLoading) {
		return (
			<div className="flex min-h-screen items-center justify-center">
				<div className="text-center">
					<Loader />
				</div>
			</div>
		);
	}

	if (error) {
		return (
			<div className="flex min-h-screen items-center justify-center">
				<div className="border-error-disabled bg-error-bg rounded-lg border p-6 text-center">
					<p className="text-error text-sm font-medium">
						Data fetching error: {error}
					</p>
					<button
						className="text-error hover:text-error-hover mt-4 cursor-pointer text-xs font-semibold underline"
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
			firstName={user?.firstName ?? ""}
			isOrgAdmin={isOrgAdmin}
			lastName={user?.lastName ?? ""}
			onCreateProject={handleCreateProject}
			onLogOut={handleLogOut}
			onOpenSettings={handleOpenSettings}
			onSelectProject={handleSelectProject}
			organizationName={user?.organizationName ?? ""}
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
						element: <LandingPage />,
						path: AppRoute.ROOT,
					},
					{
						children: [
							{
								element: <App />,
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
