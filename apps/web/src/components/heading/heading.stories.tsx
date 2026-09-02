import type { Meta, StoryObj } from "@storybook/react";

import { Heading } from "./heading.js";

const meta = {
	component: Heading,
	title: "Components/Typography/Heading",
} satisfies Meta<typeof Heading>;

type Story = StoryObj<typeof meta>;

const Level1: Story = {
	args: {
		children: "Heading 1 — Main Document Title",
		level: 1,
	},
};

const Level2: Story = {
	args: {
		children: "Heading 2 — Section Header",
		level: 2,
	},
};

const Level3: Story = {
	args: {
		children: "Heading 3 — Subsection Header",
		level: 3,
	},
};

const Level4: Story = {
	args: {
		children: "Heading 4 — Card or Panel Title",
		level: 4,
	},
};

const Level5: Story = {
	args: {
		children: "Heading 5 — Item Title",
		level: 5,
	},
};

const Level6: Story = {
	args: {
		children: "Heading 6 — Subtitle or Category",
		level: 6,
	},
};

export default meta;
export { Level1, Level2, Level3, Level4, Level5, Level6 };
