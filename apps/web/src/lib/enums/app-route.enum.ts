const AppRoute = {
	ASK_PRISM: "/ask-prism",
	GLOSSARY: "/glossary",
	KNOWLEDGE_TREE: "/knowledge-tree",
	ROOT: "/",
	SETTINGS: "/settings",
	SIGN_IN: "/sign-in",
	SIGN_UP: "/sign-up",
	USERS: "/users",
	USERS_EDIT: "/users/:id/edit",
	USERS_NEW: "/users/new",
	WORKSPACE_DETAILS: "/workspaces/:id",
	WORKSPACES: "/workspaces",
} as const;

export { AppRoute };
