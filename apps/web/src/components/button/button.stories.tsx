import type { Meta, StoryObj } from "@storybook/react";

import { Button } from "./button.js";

const meta = {
	component: Button,
	title: "Components/Form/Button",
} satisfies Meta<typeof Button>;

type Story = StoryObj<typeof meta>;

const Default: Story = {
	args: {
		label: "Click Me",
		type: "button",
	},
};

const Submit: Story = {
	args: {
		label: "Submit Form",
		type: "submit",
	},
};

export default meta;
export { Default, Submit };
