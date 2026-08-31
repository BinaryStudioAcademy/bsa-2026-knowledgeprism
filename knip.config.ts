import { type KnipConfig } from "knip";

const config: KnipConfig = {
	ignore: ["design/support.js"],
	ignoreDependencies: ["pg"],
	prettier: ["./prettier.config.js"],
	stylelint: ["./stylelint.config.ts"],
	workspaces: {
		".": {},
		"apps/api": {
			entry: ["src/infrastructure/database/migrations/*.ts"],
		},
		"apps/web": {
			// Entry point for the common app components.
			// To check unused components comment out this line.
			entry: ["src/components/components.ts"],
		},
		"apps/worker": {},
		"packages/config": {},
		"packages/constants": {},
		"packages/schemas": {},
		"packages/types": {},
	},
};

export default config;
