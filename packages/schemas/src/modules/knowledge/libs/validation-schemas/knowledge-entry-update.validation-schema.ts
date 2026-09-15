import {
	KnowledgeValidationMessage,
	KnowledgeValidationRule,
} from "@knowledgeprism/constants";
import { z } from "zod";

const blockItem = z.record(z.string(), z.unknown());

const knowledgeEntryUpdate = z
	.object({
		contentJson: z
			.array(blockItem)
			.min(KnowledgeValidationRule.CONTENT_JSON_MINIMUM_ITEMS, {
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
