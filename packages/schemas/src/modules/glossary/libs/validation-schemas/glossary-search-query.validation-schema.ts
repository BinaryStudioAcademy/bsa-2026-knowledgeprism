import {
	GlossaryValidationMessage,
	GlossaryValidationRule,
} from "@knowledgeprism/constants";
import { z } from "zod";

const glossarySearchQuery = z.object({
	q: z
		.string()
		.trim()
		.max(GlossaryValidationRule.QUERY_MAXIMUM_LENGTH, {
			error: GlossaryValidationMessage.QUERY_MAXIMUM_LENGTH,
		})
		.optional(),
});

export { glossarySearchQuery };
