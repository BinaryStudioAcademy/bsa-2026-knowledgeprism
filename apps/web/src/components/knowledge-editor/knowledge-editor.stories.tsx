import type { Meta, StoryObj } from "@storybook/react";

import { type PartialBlock } from "@blocknote/core";

import { KnowledgeEditor } from "./knowledge-editor.js";

const sampleContent = [
	{
		content: "Autonomous Sensor Platform",
		props: {
			level: 1,
		},
		type: "heading",
	},
	{
		content:
			"The platform collects telemetry from distributed devices and keeps approved technical knowledge in a structured project base.",
		type: "paragraph",
	},
	{
		content: "Ingestion supports validated source documents and manual notes.",
		type: "bulletListItem",
	},
	{
		content: "Ask Prism must answer only from approved project knowledge.",
		type: "bulletListItem",
	},
] satisfies PartialBlock[];

const diagramPlaceholderImageUrl = `data:image/svg+xml,${encodeURIComponent(
	"<svg xmlns='http://www.w3.org/2000/svg' width='640' height='360' role='img' aria-label='Architectural diagram placeholder'><rect width='640' height='360' fill='#e5e2da' /><text x='50%' y='50%' dominant-baseline='middle' text-anchor='middle' font-family='sans-serif' font-size='20' fill='#363330'>Architectural Diagram Reference</text></svg>",
)}`;

const sampleContentWithImage = [
	...sampleContent,
	{
		props: {
			caption: "Architectural diagram placeholder",
			name: "architecture-diagram.svg",
			url: diagramPlaceholderImageUrl,
		},
		type: "image",
	},
] satisfies PartialBlock[];

const meta = {
	component: KnowledgeEditor,
	decorators: [
		(Story) => (
			<div className="flex min-h-[520px] justify-center bg-bg px-6 py-8">
				<div className="w-full max-w-[680px]">
					<Story />
				</div>
			</div>
		),
	],
	title: "Components/Editors/KnowledgeEditor",
} satisfies Meta<typeof KnowledgeEditor>;

type Story = StoryObj<typeof meta>;

const Empty: Story = {
	args: {
		isEditable: true,
	},
};

const Prefilled: Story = {
	args: {
		initialContent: sampleContent,
		isEditable: true,
	},
};

const PrefilledWithImage: Story = {
	args: {
		initialContent: sampleContentWithImage,
		isEditable: true,
	},
};

const ReadOnly: Story = {
	args: {
		initialContent: sampleContent,
		isEditable: false,
	},
};

export default meta;
export { Empty, Prefilled, PrefilledWithImage, ReadOnly };
