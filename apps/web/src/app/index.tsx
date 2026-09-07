import { StrictMode, useCallback, useEffect } from "react";
import { createRoot } from "react-dom/client";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";

import "~/styles/styles.css";
import { StoreProvider } from "~/components/components.js";
import { AppRoute } from "~/lib/enums/enums.js";
import { type AppDispatch, type RootState, store } from "~/lib/store/store.js";
import { AuthPage } from "~/modules/auth/components/auth-page.js";
import { WorkspacesApi } from "~/modules/workspaces/api/workspaces-api.js";
import {
	ProjectDetailsPage,
	WorkspacePage,
} from "~/modules/workspaces/components/components.js";
import {
	fetchProjects,
	fetchRecentDocuments,
} from "~/modules/workspaces/state/workspaces.slice.js";

import { App } from "./app.js";
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

	const handleCreateProject = useCallback(() => {}, []);
	const handleLogOut = useCallback(() => {}, []);
	const handleOpenSettings = useCallback(() => {}, []);

	const handleSelectDocument = useCallback((id: string) => {
		alert(`Selected document: ${id}`);
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
					<p className="text-sm text-[#8C8880]">Loading workspace...</p>
				</div>
			</div>
		);
	}

	if (error) {
		return (
			<div className="flex items-center justify-center min-h-screen">
				<div className="p-6 text-center rounded-lg border border-red-200 bg-red-50">
					<p className="text-sm font-medium text-red-600">
						Data fetching error: {error}
					</p>
					<button
						className="mt-4 text-xs font-semibold text-red-700 underline"
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
								element: "Root",
								path: AppRoute.ROOT,
							},
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
						element: <App />,
						path: AppRoute.ROOT,
					},
				]}
			/>
		</StoreProvider>
	</StrictMode>,
);
