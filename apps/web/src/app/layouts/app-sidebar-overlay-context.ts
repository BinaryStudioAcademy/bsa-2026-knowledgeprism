import { createContext, useContext } from "react";

import { type ShellSidebar } from "~/components/sidebar/libs/use-shell-sidebar.hook.js";

const AppSidebarOverlayContext = createContext<null | ShellSidebar>(null);

const useAppSidebarOverlay = (): ShellSidebar => {
	const context = useContext(AppSidebarOverlayContext);
	if (!context) {
		throw new Error(
			"useAppSidebarOverlay must be used within AppSidebarOverlayContext.Provider",
		);
	}
	return context;
};

export { AppSidebarOverlayContext, useAppSidebarOverlay };
