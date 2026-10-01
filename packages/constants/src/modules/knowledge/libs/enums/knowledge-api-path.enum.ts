const KnowledgeApiPath = {
	ENTRY_$ID: "/:projectId/knowledge/:id",
	PLACEMENT_$ID: "/:projectId/knowledge/:id/placement",
	RECENT: "/recent",
	ROOT: "/:projectId/knowledge",
	SEARCH: "/:projectId/knowledge/search",
} as const;

export { KnowledgeApiPath };
