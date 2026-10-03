import { ExtractionBlockBackground } from "@knowledgeprism/types";

import { BLOCK_SCHEMA } from "~/modules/knowledge-extraction/libs/constants/extraction-output-schema.constant.js";

const MERGE_BLOCK_SCHEMA = {
	...BLOCK_SCHEMA,
	properties: {
		...BLOCK_SCHEMA.properties,
		props: {
			...BLOCK_SCHEMA.properties.props,
			properties: {
				...BLOCK_SCHEMA.properties.props.properties,
				backgroundColor: {
					enum: Object.values(ExtractionBlockBackground),
					type: "string",
				},
			},
		},
	},
} as const;

const NODE_MERGE_OUTPUT_SCHEMA = {
	additionalProperties: false,
	properties: {
		blocks: { items: MERGE_BLOCK_SCHEMA, type: "array" },
	},
	required: ["blocks"],
	type: "object",
} as const;

export { NODE_MERGE_OUTPUT_SCHEMA };
