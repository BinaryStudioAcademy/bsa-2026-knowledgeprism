import { LANDING_SECTION_CONTAINER_CLASS } from "~/modules/landing/libs/constants.js";

const HEADER_LABEL = {
	MENU: "Menu",
	MOBILE_NAV: "Mobile",
	PRIMARY_NAV: "Primary",
	SIGN_IN: "Sign in",
	SIGN_UP: "Sign up",
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

const LANDING_HEADER_CLASS = {
	FOCUS_RING:
		"focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-accent/35",
	INNER: `${LANDING_SECTION_CONTAINER_CLASS} flex h-[72px] items-center justify-between`,
	MOBILE_NAV: `${LANDING_SECTION_CONTAINER_CLASS} flex flex-col gap-3.5 border-t border-border bg-bg pb-6 pt-4 tablet:hidden`,
} as const;

export {
	HEADER_LABEL,
	HEADER_MENU_ICON_HEIGHT,
	HEADER_MENU_ICON_STROKE_WIDTH,
	HEADER_MENU_ICON_WIDTH,
	HEADER_NAV_ID,
	HEADER_SECTION_LINKS,
	LANDING_HEADER_CLASS,
};
