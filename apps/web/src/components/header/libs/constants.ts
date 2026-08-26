const HEADER_BRAND_NAME = "KnowledgePrism";

const HEADER_LABEL = {
	MENU: "Menu",
	SIGN_IN: "Sign in",
	SIGN_UP: "Sign up",
} as const;

const HEADER_LOGO_FILL = {
	DARK: "#1e5044",
	LIGHT: "#3a8b74",
	MEDIUM: "#2a6b5a",
} as const;

const HEADER_LOGO_SIZE = 24;

const HEADER_MENU_ICON_HEIGHT = 14;
const HEADER_MENU_ICON_STROKE_WIDTH = 1.6;
const HEADER_MENU_ICON_WIDTH = 20;

const HEADER_MOBILE_BREAKPOINT = 860;

const HEADER_NAV_ID = "header-nav";

const HEADER_SECTION_LINKS = [
	{ href: "#what", label: "Product" },
	{ href: "#how", label: "How it works" },
	{ href: "#features", label: "Features" },
] as const;

export {
	HEADER_BRAND_NAME,
	HEADER_LABEL,
	HEADER_LOGO_FILL,
	HEADER_LOGO_SIZE,
	HEADER_MENU_ICON_HEIGHT,
	HEADER_MENU_ICON_STROKE_WIDTH,
	HEADER_MENU_ICON_WIDTH,
	HEADER_MOBILE_BREAKPOINT,
	HEADER_NAV_ID,
	HEADER_SECTION_LINKS,
};
