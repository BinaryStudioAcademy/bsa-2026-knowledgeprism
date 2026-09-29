import { Outlet } from "react-router-dom";

import { usePageTitle } from "~/hooks/hooks.js";

const RootLayout: React.FC = () => {
	usePageTitle();

	return <Outlet />;
};

export { RootLayout };
