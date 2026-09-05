const CTA_SECTION_COPY = {
	body: "Join teams managing internal knowledge bases with precision instead of folders.",
	heading: "Ready to bring order to your chaos?",
	primaryCTA: "Request Early Access",
	secondaryCTA: "View Documentation",
} as const;

const CTA_SECTION_CLASS = {
	ACTIONS: "flex flex-wrap justify-center gap-3.5",
	BODY: "mx-auto mb-8 max-w-[520px] text-[15.5px] leading-[1.65] text-primary-fg/65",
	HEADING:
		"mb-4 font-serif text-[clamp(28px,4vw,42px)] font-normal leading-[1.15] text-primary-fg",
	INNER:
		"relative mx-auto max-w-[760px] px-[clamp(20px,5vw,40px)] py-[clamp(64px,9vw,120px)] text-center",
	MARK: "pointer-events-none absolute left-[8%] top-[14%] size-[30px] text-primary-fg/[0.15]",
	PRIMARY_BUTTON: "bg-primary-fg text-primary hover:bg-success-bg",
	ROOT: "relative overflow-hidden bg-primary",
	SECONDARY_BUTTON:
		"border-primary-fg/30 bg-transparent text-primary-fg hover:bg-primary-fg/[0.08]",
} as const;

export { CTA_SECTION_CLASS, CTA_SECTION_COPY };
