import { LANDING_SECTION_CONTAINER_CLASS } from "~/modules/landing/libs/constants.js";

const HOW_IT_WORKS_SECTION_COPY = {
	eyebrow: "How it works",
	heading: "From raw files to answered questions.",
} as const;

const HOW_IT_WORKS_STEPS = [
	{
		body: "Drop in PDFs, specs and plain text — no formatting required.",
		number: "01",
		title: "Ingest",
		variant: "default",
	},
	{
		body: "Prism identifies entities, relationships and hierarchies automatically.",
		number: "02",
		title: "Extract",
		variant: "default",
	},
	{
		body: "Everything lands in a queryable graph — Knowledge Trees, shared Glossary.",
		number: "03",
		title: "Structure",
		variant: "default",
	},
	{
		body: "Ask Prism questions in plain language. Every answer cites its source.",
		number: "04",
		title: "Ask",
		variant: "highlight",
	},
] as const;

const HOW_IT_WORKS_SECTION_CLASS = {
	CARDS: "flex flex-wrap gap-5",
	HEADER: "mx-auto mb-8 max-w-[600px] text-center tablet:mb-14",
	HEADING:
		"mt-3 font-serif text-[clamp(26px,3.2vw,34px)] font-normal leading-[1.2] text-text",
	INNER: `${LANDING_SECTION_CONTAINER_CLASS} py-[clamp(64px,9vw,120px)]`,
	ROOT: "border-y border-border bg-secondary",
} as const;

const HOW_IT_WORKS_BADGE_CLASS =
	"mb-4 flex size-[34px] items-center justify-center rounded-lg font-mono text-[13px] font-semibold";
const HOW_IT_WORKS_BODY_CLASS = "text-[13px] leading-[1.6]";
const HOW_IT_WORKS_CARD_CLASS = "min-w-[220px] flex-1 rounded-xl p-6";
const HOW_IT_WORKS_TITLE_CLASS = "mb-2 text-[15px] font-medium";

const HOW_IT_WORKS_STEP_CLASS = {
	BADGE: {
		default: `${HOW_IT_WORKS_BADGE_CLASS} bg-success-bg text-accent`,
		highlight: `${HOW_IT_WORKS_BADGE_CLASS} bg-primary-fg/[0.12] text-primary-fg`,
	},
	BODY: {
		default: `${HOW_IT_WORKS_BODY_CLASS} text-text-muted`,
		highlight: `${HOW_IT_WORKS_BODY_CLASS} text-primary-fg/70`,
	},
	CARD: {
		default: `${HOW_IT_WORKS_CARD_CLASS} border border-border bg-surface`,
		highlight: `${HOW_IT_WORKS_CARD_CLASS} border border-primary bg-primary`,
	},
	TITLE: {
		default: `${HOW_IT_WORKS_TITLE_CLASS} text-text`,
		highlight: `${HOW_IT_WORKS_TITLE_CLASS} text-primary-fg`,
	},
} as const;

export {
	HOW_IT_WORKS_SECTION_CLASS,
	HOW_IT_WORKS_SECTION_COPY,
	HOW_IT_WORKS_STEP_CLASS,
	HOW_IT_WORKS_STEPS,
};
