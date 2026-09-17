const AppRoute = {
	KNOWLEDGE_ADD: "/workspace/knowledge/add",
	KNOWLEDGE_TREE: "/workspace/knowledge/tree",
	ROOT: "/",
	SETTINGS: "/settings",
	SIGN_IN: "/sign-in",
	SIGN_UP: "/sign-up",
	USERS: "/users",
	USERS_EDIT: "/users/:id/edit",
	USERS_NEW: "/users/new",
	WORKSPACE: "/workspace",
} as const;

export { AppRoute };
