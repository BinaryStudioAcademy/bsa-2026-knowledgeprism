const DatabaseConstraintName = {
	DOCUMENTS_PROJECT_ID_FOREIGN: "documents_project_id_foreign",
	GLOSSARY_TERMS_PROJECT_ID_LOWER_NAME_UNIQUE:
		"glossary_terms_project_id_lower_name_unique",
	PROJECT_MEMBERS_PROJECT_ID_USER_ID_UNIQUE:
		"project_members_project_id_user_id_unique",
} as const;

export { DatabaseConstraintName };
