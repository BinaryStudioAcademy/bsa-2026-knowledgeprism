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
		body: "Each organisation's data and knowledge are isolated from other organisations.",
		iconName: "shield",
		id: FeatureId.SECURITY,
		title: "Enterprise security",
	},
] as const;

const FEATURE_TAB_ICON_SIZE = 18;
const FEATURE_SEARCH_BAR_ICON_SIZE = 15;
const FEATURE_EXTRACT_ARROW_ICON_SIZE = 20;

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
		BADGES: ["PER ORGANISATION", "NO CROSS-TENANT ACCESS"],
	},
} as const;

export {
	FEATURE_EXTRACT_ARROW_ICON_SIZE,
	FEATURE_PREVIEW_CONTENT,
	FEATURE_SEARCH_BAR_ICON_SIZE,
	FEATURE_TAB_ICON_SIZE,
	FEATURES_LIST,
	FEATURES_SECTION_COPY,
};
