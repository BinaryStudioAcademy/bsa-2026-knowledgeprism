import { type KnipConfig } from "knip";

const config: KnipConfig = {
	ignore: ["design/support.js"],
	prettier: ["./prettier.config.js"],
	stylelint: ["./stylelint.config.ts"],
	workspaces: {
		".": {},
		"apps/api": {
			entry: ["src/infrastructure/database/migrations/*.ts"],
		},
		"apps/web": {},
		"apps/worker": {},
		"packages/config": {
			includeEntryExports: true,
		},
		"packages/constants": {
			includeEntryExports: true,
		},
		"packages/schemas": {
			includeEntryExports: true,
		},
		"packages/types": {
			includeEntryExports: true,
		},
	},
};

export default config;
