import type { Meta, StoryObj } from "@storybook/react";

import { fn } from "@storybook/test";

import { KbEntryDetail } from "./kb-entry-detail.js";

const TIMEOUT_DELAY_MS = 1500;

const BASE_CONTENT = "Rule 1: Password must contain at least 8 characters.";

const BASE_ENTRY = {
	contentJson: [
		{
			content: BASE_CONTENT,
			type: "paragraph",
		},
	],
	id: 1,
	title: "Password Validation",
};

const meta: Meta<typeof KbEntryDetail> = {
	args: {
		onSave: fn(async () => {
			await new Promise((resolve) => {
				setTimeout(resolve, TIMEOUT_DELAY_MS);
			});
		}),
	},
	component: KbEntryDetail,
	title: "Features/Knowledge/KbEntryDetail",
};

type Story = StoryObj<typeof KbEntryDetail>;

const Default: Story = {
	args: {
		entry: BASE_ENTRY,
	},
};

const ViewerMode: Story = {
	args: {
		entry: BASE_ENTRY,
	},
};

const SaveError: Story = {
	args: {
		entry: BASE_ENTRY,
		onSave: fn(async () => {
			await new Promise((resolve) => {
				setTimeout(resolve, TIMEOUT_DELAY_MS);
			});

			throw new Error("Internal Server Error 500");
		}),
	},
};

export default meta;

export { Default, SaveError, ViewerMode };
