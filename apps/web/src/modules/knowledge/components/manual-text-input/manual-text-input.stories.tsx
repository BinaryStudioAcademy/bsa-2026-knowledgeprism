import type { Meta, StoryObj } from "@storybook/react";

import { fn } from "@storybook/test";

import { ManualTextInput } from "./manual-text-input.js";

const meta = {
	args: {
		isLoading: false,
		onCancel: fn(),
		onSubmit: fn(),
	},
	component: ManualTextInput,
	decorators: [
		(Story) => (
			<div className="min-h-screen bg-bg p-8">
				<div className="mx-auto max-w-2xl overflow-hidden rounded-lg bg-surface shadow-lg">
					<Story />
				</div>
			</div>
		),
	],
	title: "Features/Knowledge/Manual Text Input",
} satisfies Meta<typeof ManualTextInput>;

type Story = StoryObj<typeof meta>;

const Default: Story = {};

const Loading: Story = {
	args: {
		isLoading: true,
	},
};

export default meta;
export { Default, Loading };
