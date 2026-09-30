const GlossaryApiPath = {
	CHECK_CONSISTENCY: "/:projectId/glossary/check-consistency",
	ROOT: "/:projectId/glossary",
	TERM_$ID: "/:projectId/glossary/:id",
} as const;

export { GlossaryApiPath };
