import { Outlet, ScrollRestoration } from "react-router-dom";

import { usePageTitle } from "~/hooks/hooks.js";

const RootLayout: React.FC = () => {
	usePageTitle();

	return (
		<>
			<Outlet />
			<ScrollRestoration />
		</>
	);
};

export { RootLayout };
