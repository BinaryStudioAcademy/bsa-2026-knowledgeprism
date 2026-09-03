import type { Meta, StoryObj } from "@storybook/react";

import { Icon } from "./icon.js";

const ICON_NAMES = [
	"add-knowledge",
	"aperture",
	"aperture-expanded",
	"arrow-right-long",
	"ask-prism",
	"bell",
	"bullet-point",
	"checkbox-tick",
	"chevron-down",
	"chevron-filled-down",
	"chevron-filled-right",
	"chevron-filled-up",
	"close",
	"desktop",
	"file",
	"file-rounded",
	"file-sharp",
	"filter",
	"folder",
	"glossary",
	"hamburger",
	"help",
	"hexagon-node",
	"knowledge-tree",
	"link",
	"paragraph",
	"paste-text",
	"phone",
	"plus",
	"project",
	"search",
	"send",
	"settings",
	"shield",
	"square-placeholder",
	"tablet",
	"toast-check",
	"upload",
] as const;

const meta = {
	component: Icon,
	parameters: {
		layout: "centered",
	},
	title: "Components/Display/Icon",
} satisfies Meta<typeof Icon>;

type Story = StoryObj<typeof meta>;

const Default: Story = {
	args: {
		name: "search",
		size: 16,
	},
};

const Large: Story = {
	args: {
		name: "settings",
		size: 24,
	},
};

const KnowledgeTree: Story = {
	args: {
		name: "knowledge-tree",
		size: 20,
	},
};

const AllIcons: Story = {
	args: {
		name: "search",
	},
	render: () => (
		<div className="grid grid-cols-4 gap-4 p-4">
			{ICON_NAMES.map((name) => (
				<div
					className="flex flex-col items-center justify-center rounded-lg border border-border p-3 hover:border-accent"
					key={name}
				>
					<Icon name={name} size={22} />
					<span className="mt-2 text-center text-xs text-text-muted">
						{name}
					</span>
				</div>
			))}
		</div>
	),
};

export default meta;
export { AllIcons, Default, KnowledgeTree, Large };
