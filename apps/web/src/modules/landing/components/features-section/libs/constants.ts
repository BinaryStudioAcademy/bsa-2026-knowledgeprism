import { type IconName } from "~/components/icon/icon.js";
import { type ValueOf } from "~/lib/types/types.js";

import { FeatureId } from "./enums/feature-id.enum.js";

type FeatureItem = {
	body: string;
	iconName: IconName;
	id: ValueOf<typeof FeatureId>;
	title: string;
};

type PreviewTreeSection = {
	pages: readonly string[];
	selectedPage?: string;
	title: string;
};

const LAST_INDEX_OFFSET = 1;

const FEATURES_SECTION_COPY = {
	eyebrow: "Core capabilities",
	heading: "Everything your team needs",
} as const;

const FEATURES_LIST = [
	{
		body: "Every document you add becomes a node in a shared graph — automatically filed into a Knowledge Tree. Browse sections, pages, and entries.",
		iconName: "knowledge-tree",
		id: FeatureId.KNOWLEDGE_BASE,
		title: "Unified knowledge base",
	},
	{
		body: "Review extracted knowledge and its proposed structure before approving it into the Knowledge Base.",
		iconName: "eye",
		id: FeatureId.INTEGRATION,
		title: "Smart integration preview",
	},
	{
		body: "Ask questions in natural language. Every answer is grounded in your knowledge base with clickable source references. No hallucination.",
		iconName: "ask-prism",
		id: FeatureId.ASK_PRISM,
		title: "Ask Prism — semantic search",
	},
	{
		body: "Knowledge Tree is cross-linked to a project-wide Glossary, that is searchable by meaning, not just keywords.",
		iconName: "glossary",
		id: FeatureId.GLOSSARY,
		title: "Shared Glossary",
	},
] as const satisfies readonly FeatureItem[];

const FEATURE_PREVIEW_FRAME_CLASS = "w-full max-w-[340px]" as const;

const FEATURE_TAB_ICON_SIZE = 18;
const FEATURE_PREVIEW_ICON_SIZE = 12;
const FEATURE_SOURCE_ICON_SIZE = 11;
const FEATURE_LINK_ICON_SIZE = 12;
const FEATURE_AVATAR_ICON_SIZE = 12;

const KNOWLEDGE_BASE_SECTIONS: readonly PreviewTreeSection[] = [
	{
		pages: ["SKU management rules", "Pricing & discounts"],
		title: "Product Catalogue",
	},
	{
		pages: ["Refund policy logic"],
		selectedPage: "Refund policy logic",
		title: "Checkout & Payments",
	},
	{
		pages: ["Dispatch rules"],
		title: "Shipping & Fulfilment",
	},
];

const FEATURE_PREVIEW_CONTENT = {
	ASK_PRISM: {
		ANSWER:
			"Customers may request a refund within 14 days of delivery. Items must be unused and in original packaging.",
		QUESTION: "When can a customer request a refund after delivery?",
		SOURCE_SECTION: "Checkout & Payments",
		SOURCE_TITLE: "Refund policy logic",
	},
	GLOSSARY: {
		BODY: "The period after delivery during which a customer can return an unused item in its original packaging.",
		LINKED_ENTRY: "Refund policy logic",
		TAG: "POLICY",
		TITLE: "Refund window",
	},
	INTEGRATION: {
		ACTION: "Approve & save",
		PARENT: "Checkout & Payments",
		STATUS: "created",
		TITLE: "Refund policy logic",
	},
	KNOWLEDGE_BASE: {
		SECTIONS: KNOWLEDGE_BASE_SECTIONS,
		TITLE: "Knowledge Tree",
	},
} as const;

export {
	FEATURE_AVATAR_ICON_SIZE,
	FEATURE_LINK_ICON_SIZE,
	FEATURE_PREVIEW_CONTENT,
	FEATURE_PREVIEW_FRAME_CLASS,
	FEATURE_PREVIEW_ICON_SIZE,
	FEATURE_SOURCE_ICON_SIZE,
	FEATURE_TAB_ICON_SIZE,
	FEATURES_LIST,
	FEATURES_SECTION_COPY,
	LAST_INDEX_OFFSET,
};
