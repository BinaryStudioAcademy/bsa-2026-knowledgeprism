import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import "~/styles/styles.css";
import { StoreProvider } from "~/components/components.js";
import { AppRoute } from "~/lib/enums/enums.js";
import { store } from "~/lib/store/store.js";
import { AuthPage } from "~/modules/auth/components/auth-page.js";
import { AddKnowledgePage } from "~/modules/knowledge/components/add-knowledge-page.js";
import { LandingPage } from "~/modules/landing/components/landing-page.js";
import { NotFoundPage } from "~/modules/not-found/components/not-found-page.js";
import { AccountSettingsPage } from "~/modules/users/components/account-settings-page.js";

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
								element: <p>Organisation Workspace</p>,
								path: AppRoute.WORKSPACE,
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
									{
										element: <AddKnowledgePage />,
										path: AppRoute.ADD_KNOWLEDGE,
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
