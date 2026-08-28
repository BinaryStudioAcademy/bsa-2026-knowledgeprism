const HEADER_BRAND_NAME = {
	ACCENT: "Prism",
	LEAD: "Knowledge",
} as const;

const HEADER_CLASS = {
	BAR: "flex min-h-[72px] flex-wrap items-center justify-between px-6 min-[860px]:px-10",
	BRAND:
		"flex items-center gap-2 font-serif text-[20px] text-text no-underline hover:no-underline hover:text-text",
	BRAND_ACCENT: "text-accent",
	LINK: "text-sm text-text-muted no-underline hover:text-text hover:no-underline",
	NAV: "basis-full flex-col gap-4 pb-5 min-[860px]:flex min-[860px]:basis-auto min-[860px]:flex-row min-[860px]:items-center min-[860px]:gap-8 min-[860px]:p-0",
	NAV_CLOSED: "hidden",
	NAV_OPEN: "flex",
	ROOT: "sticky top-0 z-30 border-b border-border bg-bg/92 backdrop-blur-[6px]",
	SIGN_IN: "text-sm font-medium text-text no-underline hover:no-underline",
	SIGN_UP: "btn btn-primary no-underline hover:no-underline",
	TOGGLE:
		"cursor-pointer border-0 bg-transparent p-2 text-text min-[860px]:hidden",
} as const;

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
	HEADER_CLASS,
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
