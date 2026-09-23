const AppRoute = {
	PROJECT_ASK_PRISM: "/workspaces/:projectId/ask-prism",
	PROJECT_GLOSSARY: "/workspaces/:projectId/glossary",
	PROJECT_KNOWLEDGE_TREE: "/workspaces/:projectId/knowledge-tree",
	ROOT: "/",
	SETTINGS: "/settings",
	SIGN_IN: "/sign-in",
	SIGN_UP: "/sign-up",
	USERS: "/users",
	USERS_EDIT: "/users/:id/edit",
	USERS_NEW: "/users/new",
	WORKSPACE_DETAILS: "/workspaces/:projectId",
	WORKSPACES: "/workspaces",
} as const;

export { AppRoute };
