import { KnowledgeValidationRule } from "@knowledgeprism/constants";
import { z } from "zod";

const knowledgeSearchQueryValidationSchema = z.object({
	q: z.string().trim().max(KnowledgeValidationRule.QUERY_MAXIMUM_LENGTH),
});

export { knowledgeSearchQueryValidationSchema };
