import { LANDING_SECTION_CONTAINER_CLASS } from "~/modules/landing/libs/constants.js";
import { FeatureId } from "./enums/feature-id.enum.js";

const FEATURES_SECTION_COPY = {
	eyebrow: "Why it's different",
	heading: "Built for precision, not just storage.",
} as const;

const FEATURES_LIST = [
	{
		body: "Find concepts, not just keywords.",
		iconName: "search",
		id: FeatureId.SEARCH,
		title: "Semantic search",
	},
	{
		body: "Unstructured input becomes a queryable graph.",
		iconName: "plus",
		id: FeatureId.EXTRACT,
		title: "Automated extraction",
	},
	{
		body: "One taxonomy across every project.",
		iconName: "glossary",
		id: FeatureId.GLOSSARY,
		title: "Shared glossary",
	},
	{
		body: "Role-based access and full audit logs.",
		iconName: "shield",
		id: FeatureId.SECURITY,
		title: "Enterprise security",
	},
] as const;

const FEATURE_TAB_ICON_SIZE = 18;
const FEATURE_SEARCH_BAR_ICON_SIZE = 15;
const FEATURE_EXTRACT_ARROW_ICON_SIZE = 20;

const FEATURES_SECTION_CLASS = {
	HEADER: "mx-auto mb-8 max-w-[600px] text-center tablet:mb-14",
	HEADING:
		"mt-3 font-serif text-[clamp(26px,3.2vw,34px)] font-normal leading-[1.2] text-text",
	PANEL:
		"flex w-full flex-col overflow-hidden rounded-2xl border border-border bg-surface tablet:flex-row",
	ROOT: `${LANDING_SECTION_CONTAINER_CLASS} py-[clamp(64px,9vw,120px)]`,
	TABS: "flex w-full min-w-0 flex-1 flex-col tablet:min-w-[280px]",
} as const;

const FEATURE_TAB_ICON_CLASS = "mt-0.5 shrink-0";
const FEATURE_TAB_TITLE_CLASS = "mb-1 text-[15px] font-medium";

const FEATURE_TAB_CLASS = {
	BODY: "text-[12.5px] leading-[1.55] text-text-muted",
	DIVIDER: "border-b border-border-subtle",
	FOCUS_RING:
		"focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-accent/35",
	ICON: {
		active: `${FEATURE_TAB_ICON_CLASS} text-accent`,
		default: `${FEATURE_TAB_ICON_CLASS} text-text-faint`,
	},
	ROOT: "flex w-full cursor-pointer gap-3.5 border-l-[3px] px-[26px] py-[22px] text-left",
	STATE: {
		active: "border-accent bg-success-bg",
		default: "border-transparent bg-surface",
	},
	TITLE: {
		active: `${FEATURE_TAB_TITLE_CLASS} text-accent`,
		default: `${FEATURE_TAB_TITLE_CLASS} text-text`,
	},
} as const;

const FEATURE_PREVIEW_CONTENT = {
	EXTRACT: {
		LABEL: "Resolution",
		RAW: "Raw PDF",
		VALUE: "48 Megapixels",
	},
	GLOSSARY: {
		BODY: "The hierarchical classification of information entities, enabling structured retrieval.",
		TAG: "ARCHITECTURE",
		TITLE: "Taxonomy",
	},
	SEARCH: {
		QUERY: "low-light sensor specs",
		RESULTS: [
			{
				isDimmed: false,
				subtitle: "48MP · f/1.8–2.4 · optimized for low light",
				title: "Camera system",
			},
			{
				isDimmed: true,
				subtitle: "ISP core · MIPI CSI-2 bus",
				title: "Processor architecture",
			},
		],
	},
	SECURITY: {
		AUDIT_ACTOR: "Sarah J. edited Camera system",
		AUDIT_TIME: "2h ago",
		BADGES: ["SOC 2 TYPE II", "GDPR READY"],
	},
} as const;

const FEATURE_PREVIEW_CLASS = {
	EXTRACT: {
		ARROW: "shrink-0 text-accent",
		LABEL: "font-medium text-[9.5px] uppercase text-accent",
		RAW: "w-[90px] rounded-md border border-border bg-surface p-3 text-center text-[11px] text-text-faint",
		RESULT: "flex-1 rounded-md border border-accent bg-success-bg p-3",
		ROOT: "flex w-full max-w-[340px] items-center gap-3.5",
		VALUE: "mt-0.5 text-[13px] font-medium text-text",
	},
	GLOSSARY: {
		BODY: "text-[13px] leading-[1.6] text-text-muted",
		HEADER: "mb-2 flex justify-between",
		ROOT: "w-full max-w-[340px] rounded-[10px] border border-border bg-surface p-[18px]",
		TAG: "rounded-[5px] bg-border-subtle px-2 py-[3px] font-mono text-[9.5px] font-medium text-text-muted",
		TITLE: "font-serif text-[17px] font-normal text-text",
	},
	LAYER: "col-start-1 row-start-1",
	LAYER_INACTIVE: "invisible",
	ROOT: "flex w-full min-w-0 flex-1 items-center justify-center border-t border-border bg-bg p-10 tablet:flex-[1.3] tablet:border-l tablet:border-t-0",
	SEARCH: {
		BAR: "mb-4 flex items-center gap-2.5 rounded-[10px] border border-border bg-surface px-4 py-3.5 text-accent",
		QUERY: "text-[13.5px] text-text",
		RESULTS: "flex flex-col gap-2",
		RESULT_ACTIVE: "rounded-md border border-border bg-surface px-3 py-2.5",
		RESULT_DIMMED:
			"rounded-md border border-border bg-surface px-3 py-2.5 opacity-60",
		RESULT_SUBTITLE: "mt-0.5 text-[11.5px] text-text-faint",
		RESULT_TITLE: "text-[12.5px] font-medium text-text",
		ROOT: "w-full max-w-[340px]",
	},
	SECURITY: {
		AUDIT:
			"flex items-center justify-between rounded-md border border-border bg-surface px-3 py-2.5 text-[12px] text-text-muted",
		AUDIT_TIME: "font-mono text-[11px]",
		BADGE:
			"rounded-[5px] border border-border bg-surface px-2.5 py-[5px] font-mono text-[10.5px] font-medium text-text-muted",
		BADGES: "mb-3.5 flex gap-2",
		ROOT: "w-full max-w-[340px]",
	},
	STACK: "grid w-full justify-items-center",
} as const;

export {
	FEATURE_EXTRACT_ARROW_ICON_SIZE,
	FEATURE_PREVIEW_CLASS,
	FEATURE_PREVIEW_CONTENT,
	FEATURE_SEARCH_BAR_ICON_SIZE,
	FEATURE_TAB_CLASS,
	FEATURE_TAB_ICON_SIZE,
	FEATURES_LIST,
	FEATURES_SECTION_CLASS,
	FEATURES_SECTION_COPY,
};
