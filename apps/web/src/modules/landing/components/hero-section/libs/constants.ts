const HERO_SECTION_COPY = {
	eyebrow: "Order from chaos",
	heading: "Turn scattered documents into one queryable knowledge graph.",
	body: "KnowledgePrism ingests your PDFs, specs and docs, extracts entities and relationships automatically, and lets your team ask questions in plain language — every answer traced back to its source.",
	primaryCTA: "Start Building",
	secondaryCTA: "View Documentation",
} as const;

const HERO_SECTION_CLASS = {
	BODY: "max-w-[480px] text-[16.5px] leading-[1.65] text-text-muted",
	HEADING:
		"font-serif text-[clamp(34px,5vw,54px)] font-normal leading-[1.08] tracking-[-0.5px] text-text",
	ROOT: "relative mx-auto flex max-w-[1240px] flex-wrap items-center gap-14 px-[clamp(20px,5vw,40px)] py-[clamp(48px,8vw,96px)]",
} as const;

export { HERO_SECTION_COPY, HERO_SECTION_CLASS };
