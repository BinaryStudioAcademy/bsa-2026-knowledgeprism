import type { Meta, StoryObj } from "@storybook/react";

import { KbEntryDetail } from "./kb-entry-detail.js";

const TIMEOUT_DELAY_MS = 500;

const meta: Meta<typeof KbEntryDetail> = {
	component: KbEntryDetail,
	title: "KnowledgeBase/KbEntryDetail",
};

type Story = StoryObj<typeof KbEntryDetail>;

const Default: Story = {
	args: {
		canEdit: true,
		entry: {
			content:
				"Join us for the grand opening of the new Youth Center. We offer various activities including coding workshops, art classes, and sports events. Everyone is welcome to participate!",
			id: "mock-entry-id",
			title: "Youth Center Grand Opening",
		},
		onSave: async (payload) => {
			await new Promise((resolve) => {
				setTimeout(resolve, TIMEOUT_DELAY_MS);
			});
			alert(
				`Data successfully saved to server:\n\nTitle: ${payload.title}\nContent: ${payload.content}`,
			);
		},
	},
};

export default meta;
export { Default };
