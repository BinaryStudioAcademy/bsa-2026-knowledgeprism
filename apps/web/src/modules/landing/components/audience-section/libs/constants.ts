import { LANDING_SECTION_CONTAINER_CLASS } from "~/modules/landing/libs/constants.js";

const AUDIENCE_SECTION_COPY = { eyebrow: "Who it's for" } as const;

const AUDIENCES = [
	{
		body: "Centralize specs and documentation that used to live in a dozen tools.",
		title: "Enterprise knowledge teams",
	},
	{
		body: "Get straight answers from process docs without pinging a colleague.",
		title: "Operations teams",
	},
	{
		body: "Keep terminology consistent across every project with a shared glossary.",
		title: "Documentation teams",
	},
] as const;

const AUDIENCE_SECTION_CLASS = {
	BODY: "text-[13.5px] leading-[1.6] text-text-muted",
	CARD: "rounded-2xl border border-border bg-surface p-[clamp(28px,4vw,48px)]",
	COLUMN: "min-w-[220px] flex-1",
	GRID: "mt-5 flex flex-wrap gap-10",
	ROOT: `${LANDING_SECTION_CONTAINER_CLASS} pb-[clamp(64px,9vw,120px)] pt-0`,
	TITLE: "mb-1.5 text-base font-medium text-text",
} as const;

export { AUDIENCE_SECTION_CLASS, AUDIENCE_SECTION_COPY, AUDIENCES };
