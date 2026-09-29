const GlossaryApiPath = {
	ROOT: "/:projectId/glossary",
	TERM_$ID: "/:projectId/glossary/:id",
} as const;

export { GlossaryApiPath };
