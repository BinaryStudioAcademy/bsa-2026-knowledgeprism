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

export default meta;
export { Default };
