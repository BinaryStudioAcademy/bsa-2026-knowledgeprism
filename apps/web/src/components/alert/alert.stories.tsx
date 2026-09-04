import type { Meta, StoryObj } from "@storybook/react";

import { Alert } from "./alert.js";

const meta = {
	component: Alert,
	title: "Components/Feedback/Alert",
} satisfies Meta<typeof Alert>;

type Story = StoryObj<typeof meta>;

const Success: Story = {
	args: {
		description: "Your knowledge base changes have been published.",
		title: "Changes Saved",
		variant: "success",
	},
};

const Warning: Story = {
	args: {
		description: "Document parsing is taking longer than expected.",
		title: "Processing Delayed",
		variant: "warning",
	},
};

const ErrorState: Story = {
	args: {
		description: "Could not extract entities from the uploaded file.",
		title: "Extraction Failed",
		variant: "error",
	},
};

export default meta;
export { ErrorState, Success, Warning };
