const EXTRACTION_OUTPUT_SCHEMA = {
	additionalProperties: false,
	properties: {
		items: {
			items: {
				additionalProperties: false,
				properties: {
					confidence: { type: "number" },
					rationale: { type: "string" },
					sourceExcerpt: { type: "string" },
					text: { type: "string" },
					title: { type: "string" },
				},
				required: ["confidence", "rationale", "sourceExcerpt", "text", "title"],
				type: "object",
			},
			type: "array",
		},
	},
	required: ["items"],
	type: "object",
} as const;

export { EXTRACTION_OUTPUT_SCHEMA };
