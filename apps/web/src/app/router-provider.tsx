import {
	createBrowserRouter,
	RouterProvider as LibraryRouterProvider,
	type RouteObject,
} from "react-router-dom";

import { RootLayout } from "./root-layout.js";

type Properties = {
	routes: RouteObject[];
};

const RouterProvider: React.FC<Properties> = ({ routes }: Properties) => (
	<LibraryRouterProvider
		router={createBrowserRouter([
			{ children: routes, element: <RootLayout /> },
		])}
	/>
);

export { RouterProvider };
