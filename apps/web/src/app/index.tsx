import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import "~/styles/styles.css";
import { StoreProvider } from "~/components/components.js";
import { AppRoute } from "~/lib/enums/enums.js";
import { store } from "~/lib/store/store.js";
import { AuthPage } from "~/modules/auth/components/auth-page.js";
import { LandingPage } from "~/modules/landing/components/landing-page.js";

import { App } from "./app.js";
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
								element: <AuthPage />,
								path: AppRoute.SIGN_IN,
							},
							{
								element: <AuthPage />,
								path: AppRoute.SIGN_UP,
							},
						],
						element: <App />,
					},
				]}
			/>
		</StoreProvider>
	</StrictMode>,
);
