import { ExtractionHeadingLevel } from "@knowledgeprism/types";

const TEXT_RUN_SCHEMA = {
	additionalProperties: false,
	properties: {
		styles: {
			additionalProperties: false,
			properties: {
				backgroundColor: { enum: ["yellow"], type: "string" },
				bold: { enum: [true], type: "boolean" },
			},
			type: "object",
		},
		text: { type: "string" },
		type: { enum: ["text"], type: "string" },
	},
	required: ["text", "type"],
	type: "object",
} as const;

const BLOCK_SCHEMA = {
	additionalProperties: false,
	properties: {
		content: { items: TEXT_RUN_SCHEMA, type: "array" },
		props: {
			additionalProperties: false,
			properties: {
				checked: { type: "boolean" },
				level: {
					enum: [ExtractionHeadingLevel.SECTION, ExtractionHeadingLevel.NESTED],
					type: "integer",
				},
				variant: { enum: ["decision", "note", "warning"], type: "string" },
			},
			type: "object",
		},
		type: {
			enum: [
				"bulletListItem",
				"callout",
				"checkListItem",
				"heading",
				"numberedListItem",
				"paragraph",
			],
			type: "string",
		},
	},
	required: ["content", "type"],
	type: "object",
} as const;

const EXTRACTION_OUTPUT_SCHEMA = {
	additionalProperties: false,
	properties: {
		items: {
			items: {
				additionalProperties: false,
				properties: {
					blocks: { items: BLOCK_SCHEMA, type: "array" },
					confidence: { type: "number" },
					excerptEnd: { type: "string" },
					excerptStart: { type: "string" },
					heading: { type: "string" },
					order: { type: "integer" },
				},
				required: [
					"blocks",
					"confidence",
					"excerptEnd",
					"excerptStart",
					"heading",
					"order",
				],
				type: "object",
			},
			type: "array",
		},
	},
	required: ["items"],
	type: "object",
} as const;

export { EXTRACTION_OUTPUT_SCHEMA };
