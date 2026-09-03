import type { Meta, StoryObj } from "@storybook/react";

import { Dropdown, type DropdownItem } from "./dropdown.js";

const noop = (): void => {
	// stories do not perform real actions
};

const items: DropdownItem[] = [
	{ label: "Duplicate", onSelect: noop },
	{ label: "Rename", onSelect: noop },
	{ isDanger: true, label: "Delete", onSelect: noop },
];

const meta = {
	component: Dropdown,
	title: "Components/Overlays/Dropdown",
} satisfies Meta<typeof Dropdown>;

type Story = StoryObj<typeof meta>;

const Default: Story = {
	args: {
		items,
		label: "Actions",
	},
};

const WithLongLabels: Story = {
	args: {
		items: [
			{ label: "Export as structured knowledge base", onSelect: noop },
			{ label: "Move to another project", onSelect: noop },
		],
		label: "Document actions",
	},
};

export default meta;
export { Default, WithLongLabels };
