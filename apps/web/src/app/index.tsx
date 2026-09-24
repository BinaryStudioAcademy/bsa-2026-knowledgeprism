import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import {
	AdminRoute,
	ProtectedRoute,
	StoreProvider,
} from "~/components/components.js";
import { AppRoute } from "~/lib/enums/enums.js";
import { store } from "~/lib/store/store.js";
import { AskPrismView } from "~/modules/ask-prism/ask-prism.js";
import { actions as authActions } from "~/modules/auth/auth.js";
import { AuthPage } from "~/modules/auth/components/auth-page.js";
import { KnowledgeSearchPage } from "~/modules/knowledge/components/components.js";
import { KnowledgeTreePage } from "~/modules/knowledge/components/knowledge-tree-page.js";
import { LandingPage } from "~/modules/landing/components/landing-page.js";
import { NotFoundPage } from "~/modules/not-found/components/not-found-page.js";
import {
	AccountSettingsPage,
	UserCreationPage,
	UserEditPage,
	UserManagementHubPage,
} from "~/modules/users/components/components.js";
import {
	ProjectDetailsPage,
	WorkspaceContainer,
} from "~/modules/workspaces/components/components.js";
import "~/styles/styles.css";

import { GlobalErrorNotifications } from "./global-error-notifications.js";
import { AppLayout } from "./layouts/app-layout.js";
import { AuthLayout } from "./layouts/auth-layout.js";
import { SidebarLayout } from "./layouts/sidebar-layout.js";
import { RouterProvider } from "./router-provider.js";

void store.instance.dispatch(authActions.loadCurrentUser());

createRoot(document.querySelector("#root") as HTMLElement).render(
	<StrictMode>
		<StoreProvider store={store.instance}>
			<GlobalErrorNotifications />
			<RouterProvider
				routes={[
					{
						element: <LandingPage />,
						path: AppRoute.ROOT,
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
						],
						element: <AuthLayout />,
					},
					{
						children: [
							{
								children: [
									{
										element: <WorkspaceContainer />,
										path: AppRoute.WORKSPACES,
									},
									{
										children: [
											{
												element: <ProjectDetailsPage />,
												index: true,
											},
											{
												element: <AskPrismView />,
												path: AppRoute.PROJECT_ASK_PRISM,
											},
											{
												element: <KnowledgeTreePage />,
												path: AppRoute.PROJECT_KNOWLEDGE_TREE,
											},
											{
												element: <KnowledgeSearchPage />,
												path: AppRoute.PROJECT_GLOSSARY,
											},
										],
										element: <SidebarLayout />,
										path: AppRoute.WORKSPACE_DETAILS,
									},
									{
										children: [
											{
												element: <AccountSettingsPage />,
												path: AppRoute.SETTINGS,
											},
											{
												children: [
													{
														element: <UserManagementHubPage />,
														path: AppRoute.USERS,
													},
													{
														element: <UserCreationPage />,
														path: AppRoute.USERS_NEW,
													},
													{
														element: <UserEditPage />,
														path: AppRoute.USERS_EDIT,
													},
												],
												element: <AdminRoute />,
											},
										],
										element: <SidebarLayout />,
									},
								],
								element: <AppLayout />,
							},
						],
						element: <ProtectedRoute />,
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
