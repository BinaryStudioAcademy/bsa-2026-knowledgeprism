import {
	GlossaryValidationMessage,
	GlossaryValidationRule,
} from "@knowledgeprism/constants";
import { z } from "zod";

const glossaryConsistencyCheckRequest = z
	.object({
		content: z
			.string({ error: GlossaryValidationMessage.CONTENT_EMPTY })
			.trim()
			.min(GlossaryValidationRule.REQUIRED_MINIMUM_LENGTH, {
				error: GlossaryValidationMessage.CONTENT_EMPTY,
			})
			.max(GlossaryValidationRule.CONTENT_MAXIMUM_LENGTH, {
				error: GlossaryValidationMessage.CONTENT_MAXIMUM_LENGTH,
			}),
	})
	.required();

export { glossaryConsistencyCheckRequest };
