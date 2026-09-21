const HEADER_LABEL = {
	GO_TO_WORKSPACE: "Go to Workspace",
	LOG_OUT: "Log Out",
	MENU: "Menu",
	MOBILE_NAV: "Mobile",
	PRIMARY_NAV: "Primary",
	SIGN_IN: "Log In",
	SIGN_UP: "Register Organisation",
} as const;

const HEADER_MENU_ICON_HEIGHT = 14;
const HEADER_MENU_ICON_STROKE_WIDTH = 1.6;
const HEADER_MENU_ICON_WIDTH = 20;

const HEADER_NAV_ID = "header-nav";

const HEADER_SECTION_LINKS = [
	{ href: "#what", label: "Product" },
	{ href: "#how", label: "How it works" },
	// Restored in weeks 5–6 with FeaturesSection:
	// { href: "#features", label: "Features" },
] as const;

const SCROLL_TO_TOP_POSITION = 0;

export {
	HEADER_LABEL,
	HEADER_MENU_ICON_HEIGHT,
	HEADER_MENU_ICON_STROKE_WIDTH,
	HEADER_MENU_ICON_WIDTH,
	HEADER_NAV_ID,
	HEADER_SECTION_LINKS,
	SCROLL_TO_TOP_POSITION,
};
