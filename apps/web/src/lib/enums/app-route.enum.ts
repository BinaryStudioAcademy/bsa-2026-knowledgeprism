const AppRoute = {
	ROOT: "/",
	SIGN_IN: "/sign-in",
	SIGN_UP: "/sign-up",
	WORKSPACE_DETAILS: "/workspaces/:id",
	WORKSPACES: "/workspaces",
} as const;

export { AppRoute };
