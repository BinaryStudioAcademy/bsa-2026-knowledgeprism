const SOCIAL_PROOF_SECTION_COPY = {
	line: "Built for teams managing complex, ever-changing knowledge",
} as const;

const SOCIAL_PROOF_LOGO_HEIGHT = 24;
const SOCIAL_PROOF_LOGO_WIDTH = 88;
const SOCIAL_PROOF_LOGO_VIEW_BOX = "0 0 88 24";

const SOCIAL_PROOF_SECTION_CLASS = {
	INNER: "mx-auto max-w-[1100px] px-[clamp(20px,5vw,40px)] py-10",
	LABEL:
		"mb-6 text-center text-[12px] font-medium uppercase tracking-[0.07em] text-text-faint",
	LOGO: "text-text-faint opacity-50",
	LOGO_ROW: "flex flex-wrap items-center justify-center gap-6",
	ROOT: "border-y border-border bg-secondary",
} as const;

export {
	SOCIAL_PROOF_LOGO_HEIGHT,
	SOCIAL_PROOF_LOGO_VIEW_BOX,
	SOCIAL_PROOF_LOGO_WIDTH,
	SOCIAL_PROOF_SECTION_CLASS,
	SOCIAL_PROOF_SECTION_COPY,
};
