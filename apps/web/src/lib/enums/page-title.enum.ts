import { type AppRoute } from "./app-route.enum.js";

const DocumentTitle = {
	APP_NAME: "KnowledgePrism",
	SEPARATOR: " | ",
} as const;

const PageTitle = {
	PROJECT_ASK_PRISM: "Ask Prism",
	PROJECT_GLOSSARY: "Glossary",
	PROJECT_KNOWLEDGE_TREE: "Knowledge Tree",
	ROOT: null,
	SETTINGS: "Account Settings",
	SIGN_IN: "Sign In",
	SIGN_UP: "Sign Up",
	USERS: "User Management",
	USERS_EDIT: "Edit User",
	USERS_NEW: "Add New User",
	WORKSPACE_DETAILS: "Workspace",
	WORKSPACES: "Workspaces",
} as const satisfies Record<keyof typeof AppRoute, null | string>;

export { DocumentTitle, PageTitle };
