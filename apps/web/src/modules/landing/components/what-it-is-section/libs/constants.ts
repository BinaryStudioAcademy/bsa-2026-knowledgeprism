import { LANDING_SECTION_CONTAINER_CLASS } from "~/modules/landing/libs/constants.js";

const WHAT_IT_IS_SECTION_COPY = {
	body: "Every document you add becomes a node in a shared graph — automatically filed into a Knowledge Tree, cross-linked to a project-wide Glossary, and searchable by meaning, not just keywords. No manual tagging, no folder archaeology.",
	eyebrow: "What it is",
	heading: "A knowledge base that organizes itself.",
} as const;

const KNOWLEDGE_TREE_PREVIEW = {
	FOLDERS: {
		HARDWARE_SPECS: "Hardware specs",
		SOFTWARE_INTEGRATION: "Software integration",
	},
	ITEMS: {
		ACTIVE: "Camera system",
		INACTIVE: "Processor architecture",
	},
	TITLE: "Knowledge Tree",
} as const;

const FOLDER_ICON_SIZE = 12;

const WHAT_IT_IS_SECTION_CLASS = {
	BODY: "max-w-[440px] text-[15.5px] leading-[1.7] text-text-muted",
	COPY: "min-w-[320px] flex-1",
	HEADING:
		"mb-4 mt-3 font-serif text-[clamp(26px,3.2vw,34px)] font-normal leading-[1.2] text-text",
	ROOT: `${LANDING_SECTION_CONTAINER_CLASS} flex flex-wrap items-center gap-x-16 gap-y-8 py-[clamp(64px,9vw,120px)]`,
} as const;

const KNOWLEDGE_TREE_FOLDER_ROW_CLASS =
	"flex items-center gap-2 text-[13px] text-text-muted";
const KNOWLEDGE_TREE_CLASS = {
	ACTIVE_ITEM:
		"rounded-md bg-border-subtle px-2 py-1.5 text-[13px] font-medium text-text",
	CHROME: "border-b border-border-subtle px-4 py-3 text-[12.5px] font-medium",
	FOLDER_ROW: KNOWLEDGE_TREE_FOLDER_ROW_CLASS,
	FOLDER_ROW_LAST: `${KNOWLEDGE_TREE_FOLDER_ROW_CLASS} mt-1`,
	INACTIVE_ITEM: "px-2 py-1.5 text-[13px] text-text-muted",
	NESTED: "flex flex-col gap-1 pl-5",
	PREVIEW: "min-w-[320px] flex-1",
	ROOT: "flex w-fullmax-w-[460px] flex-col gap-0.5 overflow-hidden rounded-xl border border-border bg-surface",
	SECTION: "flex flex-col gap-1.5 px-4 py-3",
} as const;

export {
	FOLDER_ICON_SIZE,
	KNOWLEDGE_TREE_CLASS,
	KNOWLEDGE_TREE_PREVIEW,
	WHAT_IT_IS_SECTION_CLASS,
	WHAT_IT_IS_SECTION_COPY,
};
