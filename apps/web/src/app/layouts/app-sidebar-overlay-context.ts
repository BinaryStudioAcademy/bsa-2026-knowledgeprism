import { createContext, useContext } from "react";

type AppSidebarOverlayContextValue = {
	closeOverlay: () => void;
	isOverlayOpen: boolean;
};

const AppSidebarOverlayContext = createContext<AppSidebarOverlayContextValue>({
	closeOverlay: (): void => undefined,
	isOverlayOpen: false,
});

const useAppSidebarOverlay = (): AppSidebarOverlayContextValue => {
	return useContext(AppSidebarOverlayContext);
};

export { AppSidebarOverlayContext, useAppSidebarOverlay };
