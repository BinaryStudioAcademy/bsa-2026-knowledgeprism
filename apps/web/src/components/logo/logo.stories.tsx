import type { Meta, StoryObj } from "@storybook/react";

import { MemoryRouter } from "react-router-dom";

import { AppRoute } from "~/lib/enums/enums.js";

import { Logo } from "./logo.js";

const meta = {
	component: Logo,
	decorators: [
		(Story) => (
			<MemoryRouter>
				<Story />
			</MemoryRouter>
		),
	],
	title: "Components/Navigation/Logo",
} satisfies Meta<typeof Logo>;

type Story = StoryObj<typeof meta>;

const Default: Story = {
	args: {
		hasText: true,
		size: "md",
		to: AppRoute.ROOT,
		variant: "default",
	},
};

const IconOnly: Story = {
	args: {
		hasText: false,
		size: "md",
		variant: "default",
	},
};

const Large: Story = {
	args: {
		hasText: true,
		size: "lg",
		variant: "default",
	},
};

const Inverted: Story = {
	args: {
		hasText: true,
		size: "md",
		variant: "inverted",
	},
	render: (properties) => (
		<div className="bg-primary p-6 rounded-lg">
			<Logo {...properties} />
		</div>
	),
};

export default meta;
export { Default, IconOnly, Inverted, Large };
