const LANDING_FLEX_COLUMN_CLASS =
	"min-w-0 basis-full flex-1 mobile:basis-0" as const;

const LANDING_FOCUS_RING =
	"focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-accent/35" as const;

const LANDING_REVEAL_CLASS = "landing-reveal" as const;
const LANDING_REVEAL_IN_CLASS = "landing-reveal-in" as const;

const LANDING_SECTION_PADDING_CLASS = "px-[clamp(20px,5vw,40px)]" as const;

const LANDING_SECTION_CONTAINER_CLASS =
	`mx-auto max-w-[1240px] ${LANDING_SECTION_PADDING_CLASS}` as const;

const LANDING_BALANCED_SECTION_CLASS =
	`mx-auto w-full max-w-[calc(584/34*clamp(26px,3.2vw,34px)+320px+64px+80px)] ${LANDING_SECTION_PADDING_CLASS}` as const;

export {
	LANDING_BALANCED_SECTION_CLASS,
	LANDING_FLEX_COLUMN_CLASS,
	LANDING_FOCUS_RING,
	LANDING_REVEAL_CLASS,
	LANDING_REVEAL_IN_CLASS,
	LANDING_SECTION_CONTAINER_CLASS,
};
