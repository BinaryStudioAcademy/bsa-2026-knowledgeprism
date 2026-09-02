import type { StorybookConfig } from "@storybook/react-vite";

const config: StorybookConfig = {
	addons: ["@storybook/addon-essentials", "@storybook/addon-interactions"],
	framework: {
		name: "@storybook/react-vite",
		options: {},
	},
	stories: ["../src/**/*.stories.@(js|jsx|mjs|ts|tsx)"],
};

export default config;
