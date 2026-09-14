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

export { FOLDER_ICON_SIZE, KNOWLEDGE_TREE_PREVIEW, WHAT_IT_IS_SECTION_COPY };
