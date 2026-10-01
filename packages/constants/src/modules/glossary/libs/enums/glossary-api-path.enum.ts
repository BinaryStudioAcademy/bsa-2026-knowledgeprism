const GlossaryApiPath = {
	CHECK_CONSISTENCY: "/:projectId/glossary/check-consistency",
	ROOT: "/:projectId/glossary",
	TERM_$ID: "/:projectId/glossary/:id",
	TERM_$ID_CONFIRM: "/:projectId/glossary/:id/confirm",
} as const;

export { GlossaryApiPath };
