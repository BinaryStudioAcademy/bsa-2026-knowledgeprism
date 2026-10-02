const KnowledgeApiPath = {
	ENTRY_$ID: "/:projectId/knowledge/:id",
	ENTRY_$ID_SECTIONS: "/:projectId/knowledge/:id/sections",
	PLACEMENT_$ID: "/:projectId/knowledge/:id/placement",
	RECENT: "/recent",
	ROOT: "/:projectId/knowledge",
	SEARCH: "/:projectId/knowledge/search",
} as const;

export { KnowledgeApiPath };
