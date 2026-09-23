/**
 * TODO: REMOVE THIS FILE ONCE BACKEND IS MERGED
 *
 * This file contains mock data simulating the backend API responses from the
 * `38-feat-knowledge-base-tree` branch.
 */

const KnowledgeNodeType = {
	ENTRY: "ENTRY",
	PAGE: "PAGE",
	SECTION: "SECTION",
} as const;

type KnowledgeEntryResponseDto = {
	contentJson: KnowledgeNodeContentDto;
	createdAt: string;
	id: number;
	parentId: null | number;
	position: number;
	projectId: number;
	title: string;
	type: KnowledgeNodeTypeValue;
	updatedAt: string;
};

type KnowledgeNodeContentDto = Record<string, unknown>[];

type KnowledgeNodeTypeValue =
	(typeof KnowledgeNodeType)[keyof typeof KnowledgeNodeType];

type KnowledgeTreeItemResponseDto = {
	id: number;
	parentId: null | number;
	position: number;
	title: string;
	type: KnowledgeNodeTypeValue;
	updatedAt: string;
};

type KnowledgeTreeResponseDto = {
	items: KnowledgeTreeItemResponseDto[];
};

const mockKnowledgeTreeResponse: KnowledgeTreeResponseDto = {
	items: [
		{
			id: 1,
			parentId: null,
			position: 1,
			title: "Hardware specifications",
			type: KnowledgeNodeType.SECTION,
			updatedAt: "2026-09-17T10:00:00.000Z",
		},
		{
			id: 2,
			parentId: 1,
			position: 1,
			title: "Camera system",
			type: KnowledgeNodeType.PAGE,
			updatedAt: "2026-09-17T11:00:00.000Z",
		},
		{
			id: 3,
			parentId: 1,
			position: 2,
			title: "Processor architecture",
			type: KnowledgeNodeType.PAGE,
			updatedAt: "2026-09-16T14:30:00.000Z",
		},
		{
			id: 4,
			parentId: null,
			position: 2,
			title: "Software integration",
			type: KnowledgeNodeType.SECTION,
			updatedAt: "2026-09-15T09:15:00.000Z",
		},
	],
};

const mockKnowledgeEntryCamera: KnowledgeEntryResponseDto = {
	contentJson: [
		{
			content: "Sensor Array details",
			props: { level: 2 },
			type: "heading",
		},
		{
			content:
				"The primary optical assembly incorporates a custom-designed sensor array optimized for low-light performance and high-speed capture, integrating directly with the central processing bus.",
			type: "paragraph",
		},
		{
			content: "Integration Architecture",
			props: { level: 2 },
			type: "heading",
		},
		{
			content:
				"The module connects via a dedicated high-bandwidth interface, bypassing standard data lanes to ensure minimal latency during continuous capture modes.",
			type: "paragraph",
		},
	],
	createdAt: "2026-09-10T10:00:00.000Z",
	id: 2,
	parentId: 1,
	position: 1,
	projectId: 1,
	title: "Camera system",
	type: KnowledgeNodeType.PAGE,
	updatedAt: "2026-09-17T11:00:00.000Z",
};

const mockKnowledgeEntryProcessor: KnowledgeEntryResponseDto = {
	contentJson: [
		{
			content: "Core Architecture details",
			props: { level: 2 },
			type: "heading",
		},
		{
			content:
				"The central processing unit integrates a custom neural accelerator alongside the primary compute cores, enabling on-device inference without offloading to the cloud.",
			type: "paragraph",
		},
		{
			content: "Neural accelerator with 16 cores",
			type: "bulletListItem",
		},
		{
			content: "High-bandwidth memory interface",
			type: "bulletListItem",
		},
		{
			content: "Initialize the compute cores",
			type: "numberedListItem",
		},
		{
			content: "Load the inference model",
			type: "numberedListItem",
		},
		{
			content: "Verify hardware acceleration (unchecked)",
			props: { checked: false },
			type: "checkListItem",
		},
		{
			content: "Initialize neural net weights (checked)",
			props: { checked: true },
			type: "checkListItem",
		},
		{
			children: [
				{
					content: "Enable hyper-threading for a 20% boost.",
					type: "paragraph",
				},
				{
					content: "Overclocking mode (use with caution).",
					type: "paragraph",
				},
			],
			content: "Advanced configurations",
			type: "toggleListItem",
		},
		{
			content:
				"const neuralCore = new ComputeAccelerator();\nneuralCore.initialize();",
			type: "codeBlock",
		},
		{
			content:
				"This processor achieves a 400% performance increase over the previous generation without increasing the thermal envelope.",
			type: "quote",
		},
	],
	createdAt: "2026-09-10T10:00:00.000Z",
	id: 3,
	parentId: 1,
	position: 2,
	projectId: 1,
	title: "Processor architecture",
	type: KnowledgeNodeType.PAGE,
	updatedAt: "2026-09-16T14:30:00.000Z",
};

export {
	type KnowledgeEntryResponseDto,
	type KnowledgeTreeItemResponseDto,
	KnowledgeNodeType,
	mockKnowledgeEntryCamera,
	mockKnowledgeEntryProcessor,
	mockKnowledgeTreeResponse,
};
