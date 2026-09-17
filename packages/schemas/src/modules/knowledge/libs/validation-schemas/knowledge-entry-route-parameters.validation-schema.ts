import { z } from "zod";

const POSITIVE_INTEGER_PATTERN = /^\d+$/;

const knowledgeEntryRouteParameters = z
	.object({
		id: z.string().trim().regex(POSITIVE_INTEGER_PATTERN, {
			message: "Entry ID must be a positive integer",
		}),
		projectId: z.string().trim().regex(POSITIVE_INTEGER_PATTERN, {
			message: "Project ID must be a positive integer",
		}),
	})
	.required();

export { knowledgeEntryRouteParameters };
