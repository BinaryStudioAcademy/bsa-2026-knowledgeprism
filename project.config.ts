const ProjectPrefix = {
	APP: "kp",
	CHANGE_TYPES: [
		"build",
		"chore",
		"ci",
		"docs",
		"feat",
		"fix",
		"perf",
		"refactor",
		"revert",
		"style",
		"test",
	],
	ENVIRONMENT: "main",
	ISSUE_PREFIXES: ["kp"],
	SCOPES: {
		APPS: ["web", "api", "worker"],
		PACKAGES: ["types", "schemas", "config", "constants"],
	},
} as const;

export { ProjectPrefix };
