import { LANDING_SECTION_CONTAINER_CLASS } from "~/modules/landing/libs/constants.js";

const HERO_SECTION_COPY = {
	body: "KnowledgePrism ingests your PDFs, specs and docs, extracts entities and relationships automatically, and lets your team ask questions in plain language — every answer traced back to its source.",
	eyebrow: "Order from chaos",
	heading: "Turn scattered documents into one queryable knowledge graph.",
	primaryCTA: "Start Building",
	secondaryCTA: "View Documentation",
} as const;

const HERO_SECTION_CLASS = {
	ACTIONS: "mt-8 flex flex-wrap items-center gap-3.5",
	BODY: "max-w-[480px] text-[16.5px] leading-[1.65] text-text-muted",
	COPY: "min-w-[340px] flex-1",
	HEADING:
		"mb-5 font-serif text-[clamp(34px,5vw,54px)] font-normal leading-[1.08] tracking-[-0.5px] text-text",
	ROOT: `${LANDING_SECTION_CONTAINER_CLASS} flex flex-wrap items-center gap-x-14 gap-y-7 py-[clamp(48px,8vw,96px)]`,
} as const;

const HERO_DEMO_PANEL = {
	ANSWER: "Requests within 14 days, unused, original packaging.",
	BADGE: "Live",
	BREADCRUMB: "Knowledge Base / Refund Policy",
	QUESTION: "What's the refund window?",
	STAT_LEFT: { LABEL: "Source", VALUE: "Checkout & Payments" },
	STAT_RIGHT: { LABEL: "Confidence", VALUE: "High" },
	TAG: "Refund policy logic",
	TITLE: "Refund Policy Lookup",
} as const;

const HERO_DEMO_PANEL_CLASS = {
	ANSWER: "text-[12.5px] leading-[1.5] text-text",
	ANSWER_ROW: "flex gap-2",
	AVATAR: "size-5 shrink-0 rounded-md bg-accent",
	BADGE: "flex items-center gap-1.5 text-[11.5px] text-accent",
	BADGE_DOT: "inline-block size-1.5 rounded-full bg-accent",
	BODY: "px-[18px] py-5",
	BREADCRUMB: "text-[12.5px] text-text-muted",
	BUBBLE:
		"max-w-[78%] rounded-[12px_12px_3px_12px] bg-primary px-[13px] py-2 text-[12.5px] text-primary-fg",
	CHROME:
		"flex items-center justify-between border-b border-border-subtle px-[18px] py-3.5",
	PREVIEW: "flex min-w-[340px] flex-1 justify-center",
	QUESTION_ROW: "mb-2.5 flex justify-end",
	ROOT: "w-full max-w-[440px] overflow-hidden rounded-[14px] border border-border bg-surface shadow-[0_20px_48px_rgba(45,42,38,0.12)]",
	STAT_BOX: "flex-1 rounded-lg border border-border bg-bg px-3 py-2.5",
	STAT_LABEL: "text-[9.5px] font-medium uppercase text-text-faint",
	STAT_ROW: "mb-[18px] flex gap-2.5",
	STAT_VALUE: "mt-0.5 text-[13.5px] font-medium text-text",
	TAG: "inline-flex rounded-full bg-success-bg px-1.5 py-0.5 text-[10.5px] font-medium text-accent",
	THREAD: "border-t border-border-subtle pt-4",
	TITLE: "mb-3.5 font-serif text-[19px] font-normal text-text",
} as const;

export {
	HERO_DEMO_PANEL,
	HERO_DEMO_PANEL_CLASS,
	HERO_SECTION_CLASS,
	HERO_SECTION_COPY,
};
