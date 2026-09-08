import type { Meta, StoryObj } from "@storybook/react";

import { Paragraph, ParagraphSize } from "./paragraph.js";

const meta = {
	component: Paragraph,
	title: "Components/Typography/Paragraph",
} satisfies Meta<typeof Paragraph>;

type Story = StoryObj<typeof meta>;

const Body: Story = {
	args: {
		children:
			"KnowledgePrism helps teams build a single, structured knowledge base out of diverse documents and manual input.",
		size: ParagraphSize.BODY,
	},
};

const BodySmall: Story = {
	args: {
		children:
			"This is secondary or muted helper text explaining details under inputs or panels.",
		size: ParagraphSize.BODY_SMALL,
	},
};

export default meta;
export { Body, BodySmall };
