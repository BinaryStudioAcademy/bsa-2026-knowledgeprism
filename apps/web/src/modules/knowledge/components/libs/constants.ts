import { type KnowledgeEntry } from "./types.js";

const PAGE_TITLE = "Glossary";
const SEARCH_PLACEHOLDER = "Search terms...";

const MOCK_KNOWLEDGE_ENTRIES: KnowledgeEntry[] = [
	{
		author: "Admin",
		content:
			"Hierarchical classification of information entities, enabling structured retrieval and linking.",
		id: 1,
		tag: "ARCHITECTURE",
		title: "Taxonomy",
		updatedLabel: "2d ago",
	},
	{
		author: "System",
		content:
			"Graph-based structure mapping relationships between knowledge nodes.",
		id: 2,
		tag: "DATA MODEL",
		title: "Semantic Mesh",
		updatedLabel: "5d ago",
	},
	{
		author: "Admin",
		content:
			"The threshold a retrieved match must clear before it is offered as a candidate duplicate or update.",
		id: 3,
		tag: "RETRIEVAL",
		title: "Similarity Threshold",
		updatedLabel: "1w ago",
	},
	{
		author: "System",
		content:
			"A single unit of validated knowledge stored in the project's knowledge base.",
		id: 4,
		tag: "CORE",
		title: "Knowledge Node",
		updatedLabel: "2w ago",
	},
	{
		author: "Admin",
		content:
			"The point in the pipeline where a human confirms an AI-proposed extraction is correct before it can be integrated.",
		id: 5,
		tag: "WORKFLOW",
		title: "Validation",
		updatedLabel: "3w ago",
	},
];

export { MOCK_KNOWLEDGE_ENTRIES, PAGE_TITLE, SEARCH_PLACEHOLDER };
