import type { Meta, StoryObj } from "@storybook/react";

import { Icon } from "./icon.js";

const meta = {
	component: Icon,
	parameters: {
		layout: "centered",
	},
	title: "Components/Display/Icon",
} satisfies Meta<typeof Icon>;

type Story = StoryObj<typeof meta>;

const Default: Story = {
	args: {
		name: "search",
		size: 16,
	},
};

const Large: Story = {
	args: {
		name: "settings",
		size: 24,
	},
};

const KnowledgeTree: Story = {
	args: {
		name: "knowledge-tree",
		size: 20,
	},
};

export default meta;
export { Default, KnowledgeTree, Large };
