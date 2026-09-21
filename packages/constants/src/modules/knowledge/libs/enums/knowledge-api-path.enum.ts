const KnowledgeApiPath = {
	ENTRY_$ID: "/:projectId/knowledge/:id",
	RECENT: "/recent",
	ROOT: "/:projectId/knowledge",
	SEARCH: "/:projectId/knowledge/search",
} as const;

export { KnowledgeApiPath };
