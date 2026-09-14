import {
	KnowledgeValidationMessage,
	KnowledgeValidationRule,
} from "@knowledgeprism/constants";
import { z } from "zod";

const knowledgeEntryUpdate = z
	.object({
		content: z
			.string()
			.trim()
			.min(KnowledgeValidationRule.CONTENT_MINIMUM_LENGTH, {
				error: KnowledgeValidationMessage.CONTENT_EMPTY,
			}),
		title: z
			.string()
			.trim()
			.min(KnowledgeValidationRule.TITLE_MINIMUM_LENGTH, {
				error: KnowledgeValidationMessage.TITLE_EMPTY,
			})
			.max(KnowledgeValidationRule.TITLE_MAXIMUM_LENGTH, {
				error: KnowledgeValidationMessage.TITLE_MAXIMUM_LENGTH,
			}),
	})
	.required();

export { knowledgeEntryUpdate };
