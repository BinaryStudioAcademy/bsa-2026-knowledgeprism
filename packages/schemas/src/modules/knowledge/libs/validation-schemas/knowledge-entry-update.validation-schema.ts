import {
	KnowledgeValidationMessage,
	KnowledgeValidationRule,
} from "@knowledgeprism/constants";
import { z } from "zod";

const knowledgeNodeContentItem = z.record(z.string(), z.unknown());

const knowledgeNodeContent = z
	.array(knowledgeNodeContentItem)
	.min(KnowledgeValidationRule.CONTENT_MINIMUM_LENGTH, {
		error: KnowledgeValidationMessage.CONTENT_EMPTY,
	});

const knowledgeEntryUpdate = z
	.object({
		contentJson: knowledgeNodeContent.nullable(),
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
