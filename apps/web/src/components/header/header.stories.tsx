import type { Meta, StoryObj } from "@storybook/react";

import { MemoryRouter } from "react-router-dom";

import { Header } from "./header.js";

const meta = {
	component: Header,
	decorators: [
		(Story) => (
			<MemoryRouter>
				<Story />
			</MemoryRouter>
		),
	],
	parameters: {
		layout: "fullscreen",
	},
	title: "Components/Navigation/Header",
} satisfies Meta<typeof Header>;

type Story = StoryObj<typeof meta>;

const Default: Story = {};

const CustomContent: Story = {
	args: {
		children: (
			<div className="flex h-full w-full items-center justify-between">
				<span className="font-medium text-text">Workspace header content</span>

				<span className="text-sm text-text-muted">Account actions</span>
			</div>
		),
	},
};

export default meta;
export { CustomContent, Default };
