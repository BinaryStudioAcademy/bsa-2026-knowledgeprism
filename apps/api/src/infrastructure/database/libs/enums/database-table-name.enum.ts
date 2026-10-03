const DatabaseTableName = {
	DOCUMENT_CHUNKS: "document_chunks",
	DOCUMENTS: "documents",
	EXTRACTION_ITEMS: "extraction_items",
	EXTRACTION_RESPONSES: "extraction_responses",
	EXTRACTION_RUNS: "extraction_runs",
	EXTRACTION_SECTIONS: "extraction_sections",
	GLOSSARY_TERM_RELATIONS: "glossary_term_relations",
	GLOSSARY_TERMS: "glossary_terms",
	INTEGRATION_CHANGES: "integration_changes",
	KNOWLEDGE_NODES: "knowledge_nodes",
	MIGRATIONS: "migrations",
	ORGANISATIONS: "organisations",
	PROJECT_MEMBERS: "project_members",
	PROJECT_STORAGE_CLEANUPS: "project_storage_cleanups",
	PROJECTS: "projects",
	SESSIONS: "sessions",
	USERS: "users",
} as const;

export { DatabaseTableName };
