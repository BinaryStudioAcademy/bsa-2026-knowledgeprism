const HEADER_LABEL = {
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
	{ href: "#features", label: "Features" },
] as const;

export {
	HEADER_LABEL,
	HEADER_MENU_ICON_HEIGHT,
	HEADER_MENU_ICON_STROKE_WIDTH,
	HEADER_MENU_ICON_WIDTH,
	HEADER_NAV_ID,
	HEADER_SECTION_LINKS,
};
