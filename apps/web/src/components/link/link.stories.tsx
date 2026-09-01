import type { Meta, StoryObj } from "@storybook/react";

import { MemoryRouter } from "react-router-dom";

import { AppRoute } from "~/lib/enums/enums.js";

import { Link } from "./link.js";

const meta = {
	component: Link,
	decorators: [
		(Story) => (
			<MemoryRouter>
				<Story />
			</MemoryRouter>
		),
	],
	title: "Components/Navigation/Link",
} satisfies Meta<typeof Link>;

type Story = StoryObj<typeof meta>;

const Default: Story = {
	args: {
		children: "Go to Home",
		to: AppRoute.ROOT,
	},
};

const SignIn: Story = {
	args: {
		children: "Sign In",
		to: AppRoute.SIGN_IN,
	},
};

export default meta;
export { Default, SignIn };
