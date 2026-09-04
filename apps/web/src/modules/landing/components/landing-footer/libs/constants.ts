import { LANDING_SECTION_CONTAINER_CLASS } from "~/modules/landing/libs/constants.js";

const LANDING_FOOTER_COPY = {
	copyright: "© 2026 KnowledgePrism AI. Order from Chaos.",
	links: [
		{ href: "#", label: "Privacy" },
		{ href: "#", label: "Terms" },
		{ href: "#", label: "API Documentation" },
	],
} as const;

const LANDING_FOOTER_CLASS = {
	COPYRIGHT: "font-mono text-[12px] text-text-faint",
	INNER: `${LANDING_SECTION_CONTAINER_CLASS} flex flex-wrap items-center justify-between gap-3 py-7`,
	LINK: "rounded-sm text-[12.5px] text-text-muted focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-accent/35",
	LINKS: "flex gap-6",
	ROOT: "border-t border-border",
} as const;

export { LANDING_FOOTER_CLASS, LANDING_FOOTER_COPY };
