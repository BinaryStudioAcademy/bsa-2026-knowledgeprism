import type { Meta, StoryObj } from "@storybook/react";

import { AddKnowledgeLoadingState } from "./add-knowledge-loading-state.js";

const meta = {
	component: AddKnowledgeLoadingState,
	parameters: {
		layout: "centered",
	},
	title: "Knowledge/Add Knowledge Loading State",
} satisfies Meta<typeof AddKnowledgeLoadingState>;

type Story = StoryObj<typeof meta>;

const Default: Story = {};

const ErrorState: Story = {
	args: {
		hasError: true,
		onCancel: () => {
			// mock function
		},
		onRetry: () => {
			// mock function
		},
	},
};

export { Default, ErrorState };
export default meta;
