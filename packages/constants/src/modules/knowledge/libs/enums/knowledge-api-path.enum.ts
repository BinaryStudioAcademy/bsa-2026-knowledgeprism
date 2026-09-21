const KnowledgeApiPath = {
	ENTRY_$ID: "/:projectId/knowledge/:id",
	RECENT: "/recent",
	ROOT: "/:projectId/knowledge",
} as const;

export { KnowledgeApiPath };
