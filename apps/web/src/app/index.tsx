import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import { StoreProvider } from "~/components/components.js";
import { AppRoute } from "~/lib/enums/enums.js";
import { store } from "~/lib/store/store.js";
import { AuthPage } from "~/modules/auth/components/auth-page.js";
import { LandingPage } from "~/modules/landing/components/landing-page.js";
import { NotFoundPage } from "~/modules/not-found/components/not-found-page.js";
import { AccountSettingsPage } from "~/modules/users/components/components.js";
import {
	ProjectDetailsPage,
	WorkspaceContainer,
} from "~/modules/workspaces/components/components.js";
import "~/styles/styles.css";

import { App } from "./app.js";
import { AppLayout } from "./layouts/app-layout.js";
import { AuthLayout } from "./layouts/auth-layout.js";
import { PublicLayout } from "./layouts/public-layout.js";
import { SidebarLayout } from "./layouts/sidebar-layout.js";
import { RouterProvider } from "./router-provider.js";

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
