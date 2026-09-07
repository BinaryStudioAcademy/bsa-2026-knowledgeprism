import type { Meta, StoryObj } from "@storybook/react";

import { Loader } from "./loader.js";

const meta = {
	component: Loader,
	parameters: {
		layout: "centered",
	},
	title: "Components/Feedback/Loader",
} satisfies Meta<typeof Loader>;

type Story = StoryObj<typeof meta>;

const Small: Story = {
	args: {
		size: "sm",
	},
};

const Medium: Story = {
	args: {
		size: "md",
	},
};

const Large: Story = {
	args: {
		size: "lg",
	},
};

const WithOverlay: Story = {
	args: {
		hasOverlay: true,
		size: "md",
	},
	render: (properties) => (
		<div className="relative h-48 w-72 rounded-lg border border-border p-4">
			<p className="text-text-muted">Content behind the loader overlay...</p>
			<Loader {...properties} />
		</div>
	),
};

export default meta;
export { Large, Medium, Small, WithOverlay };
