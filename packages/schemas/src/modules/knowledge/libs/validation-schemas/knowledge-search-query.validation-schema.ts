import { KnowledgeValidationRule } from "@knowledgeprism/constants";
import { z } from "zod";

const knowledgeSearchQueryValidationSchema = z.object({
	q: z
		.string()
		.trim()
		.min(KnowledgeValidationRule.QUERY_MINIMUM_LENGTH)
		.max(KnowledgeValidationRule.QUERY_MAXIMUM_LENGTH),
});

export { knowledgeSearchQueryValidationSchema };
