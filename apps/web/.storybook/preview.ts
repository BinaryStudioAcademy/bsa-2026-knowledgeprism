import type { Preview } from "@storybook/react";

import "../src/styles/styles.css";

const preview: Preview = {
	parameters: {
		backgrounds: {
			default: "brand",
			values: [
				{ name: "brand", value: "rgb(250 249 247)" },
				{ name: "white", value: "#ffffff" },
				{ name: "dark", value: "#1f1d1a" },
			],
		},
		controls: {
			matchers: {
				color: /(background|color)$/i,
				date: /Date$/i,
			},
		},
	},
};

export default preview;
