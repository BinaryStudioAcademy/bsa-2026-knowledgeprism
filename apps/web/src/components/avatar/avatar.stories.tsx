import type { Meta, StoryObj } from "@storybook/react";

import { Avatar } from "./avatar.js";

const meta = {
	component: Avatar,
	title: "Components/Display/Avatar",
} satisfies Meta<typeof Avatar>;

type Story = StoryObj<typeof meta>;

const WithInitials: Story = {
	args: {
		alt: "Sarah Jenkins",
		initials: "SJ",
	},
};

const WithImage: Story = {
	args: {
		alt: "User profile",
		src: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=128&auto=format&fit=crop&q=80",
	},
};

export default meta;
export { WithImage, WithInitials };
