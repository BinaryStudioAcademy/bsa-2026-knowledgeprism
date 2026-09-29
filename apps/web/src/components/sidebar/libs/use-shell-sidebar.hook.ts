import { useCallback, useEffect, useState } from "react";
import { useLocation } from "react-router-dom";

import {
	SIDEBAR_COLLAPSED_STORAGE_KEY,
	SIDEBAR_COLLAPSED_STORAGE_VALUE,
	SIDEBAR_EXPANDED_MEDIA_QUERY,
	SIDEBAR_RAIL_MEDIA_QUERY,
} from "./constants.js";
import { type ShellSidebarMode } from "./types/shell-sidebar-mode.type.js";

type ShellSidebar = {
	closeOverlay: () => void;
	dismissOverlay: () => void;
	isExpanded: boolean;
	isOverlayOpen: boolean;
	mode: ShellSidebarMode;
	toggleSidebar: () => void;
};

const isSidebarCollapsedPreference = (): boolean => {
	try {
		return (
			localStorage.getItem(SIDEBAR_COLLAPSED_STORAGE_KEY) ===
			SIDEBAR_COLLAPSED_STORAGE_VALUE
		);
	} catch {
		return false;
	}
};

const useIsMediaQueryMatch = (query: string): boolean => {
	const [matches, setMatches] = useState((): boolean => {
		if (typeof matchMedia !== "function") {
			return false;
		}

		return matchMedia(query).matches;
	});

	useEffect(() => {
		const mediaQueryList = matchMedia(query);

		const handleChange = (): void => {
			setMatches(mediaQueryList.matches);
		};

		handleChange();
		mediaQueryList.addEventListener("change", handleChange);

		return (): void => {
			mediaQueryList.removeEventListener("change", handleChange);
		};
	}, [query]);

	return matches;
};

const getShellSidebarMode = (
	isExpandedWidth: boolean,
	isRailWidth: boolean,
): ShellSidebarMode => {
	if (isExpandedWidth) {
		return "wide";
	}

	if (isRailWidth) {
		return "compact";
	}

	return "phone";
};

const useShellSidebar = (): ShellSidebar => {
	const { pathname } = useLocation();
	const isExpandedWidth = useIsMediaQueryMatch(SIDEBAR_EXPANDED_MEDIA_QUERY);
	const isRailWidth = useIsMediaQueryMatch(SIDEBAR_RAIL_MEDIA_QUERY);
	const mode = getShellSidebarMode(isExpandedWidth, isRailWidth);
	const [isCollapsed, setIsCollapsed] = useState(isSidebarCollapsedPreference);
	const [overlayPathname, setOverlayPathname] = useState<null | string>(null);
	const isOverlayMode = mode === "compact" || mode === "phone";
	const isOverlayOpen = isOverlayMode && overlayPathname === pathname;

	if (!isOverlayMode && overlayPathname !== null) {
		setOverlayPathname(null);
	}

	useEffect(() => {
		try {
			localStorage.setItem(SIDEBAR_COLLAPSED_STORAGE_KEY, String(isCollapsed));
		} catch {
			return;
		}
	}, [isCollapsed]);

	const closeOverlay = useCallback((): void => {
		setOverlayPathname(null);
	}, []);

	const dismissOverlay = useCallback((): void => {
		setOverlayPathname(null);

		if (mode === "compact") {
			setIsCollapsed(true);
		}
	}, [mode]);

	const toggleSidebar = useCallback((): void => {
		if (mode === "wide") {
			setIsCollapsed((collapsed) => !collapsed);

			return;
		}

		if (overlayPathname === pathname) {
			setOverlayPathname(null);

			if (mode === "compact") {
				setIsCollapsed(true);
			}

			return;
		}

		setOverlayPathname(pathname);

		if (mode === "compact") {
			setIsCollapsed(false);
		}
	}, [mode, overlayPathname, pathname]);

	const isExpanded = mode === "wide" ? !isCollapsed : isOverlayOpen;

	return {
		closeOverlay,
		dismissOverlay,
		isExpanded,
		isOverlayOpen,
		mode,
		toggleSidebar,
	};
};

export { type ShellSidebar, useShellSidebar };
