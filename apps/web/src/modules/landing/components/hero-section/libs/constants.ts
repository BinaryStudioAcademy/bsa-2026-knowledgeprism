type HeroTreeSection = {
	pages: readonly string[];
	selectedPage?: string;
	title: string;
};

const HERO_SECTION_COPY = {
	body: "KnowledgePrism ingests your messy documentation, automatically extracts entities and relationships, and turns them into a structured knowledge base. Ask questions in plain language and get grounded answers with full traceability.",
	eyebrow: "Where knowledge finds its shape",
	headingAccent: "Structured knowledge",
	headingLead: "Scattered documents in.",
	headingTail: "out.",
	primaryCTA: "Start Building",
} as const;

const HERO_DEMO_PANEL = {
	ANSWER:
		"Customers may request a refund within 14 days of delivery. Items must be unused and in original packaging.",
	QUESTION: "When can a customer request a refund after delivery?",
	SOURCE_SECTION: "Checkout & Payments",
	SOURCE_TITLE: "Refund policy logic",
	TITLE: "Knowledge Base — E-Commerce Platform",
} as const;

const HERO_TREE_SECTIONS: readonly HeroTreeSection[] = [
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
		pages: [],
		title: "Shipping & Fulfilment",
	},
	{
		pages: [],
		title: "Customer Accounts",
	},
];

const HERO_AVATAR_ICON_SIZE = 10;
const HERO_PREVIEW_ICON_SIZE = 12;
const HERO_SOURCE_ICON_SIZE = 10;

const HERO_TEXT_COLUMN_CLASS =
	"tablet:w-[calc(584/34*clamp(26px,3.2vw,34px))]" as const;

export {
	HERO_AVATAR_ICON_SIZE,
	HERO_DEMO_PANEL,
	HERO_PREVIEW_ICON_SIZE,
	HERO_SECTION_COPY,
	HERO_SOURCE_ICON_SIZE,
	HERO_TEXT_COLUMN_CLASS,
	HERO_TREE_SECTIONS,
};
