import type { Meta, StoryObj } from "@storybook/react";

import { Button } from "./button.js";

const meta = {
	component: Button,
	title: "Components/Form/Button",
} satisfies Meta<typeof Button>;

type Story = StoryObj<typeof meta>;

const Primary: Story = {
	args: {
		children: "Primary Button",
		variant: "primary",
	},
};

const Secondary: Story = {
	args: {
		children: "Secondary Button",
		variant: "secondary",
	},
};

const Destructive: Story = {
	args: {
		children: "Delete",
		variant: "destructive",
	},
};

const Ghost: Story = {
	args: {
		children: "Ghost Button",
		variant: "ghost",
	},
};

const Loading: Story = {
	args: {
		children: "Saving...",
		isLoading: true,
		variant: "primary",
	},
};

const Disabled: Story = {
	args: {
		children: "Disabled Button",
		disabled: true,
		variant: "primary",
	},
};

export default meta;
export { Destructive, Disabled, Ghost, Loading, Primary, Secondary };
