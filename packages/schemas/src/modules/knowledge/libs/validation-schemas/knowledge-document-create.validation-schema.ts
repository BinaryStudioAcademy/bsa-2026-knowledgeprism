import {
	KnowledgeValidationMessage,
	KnowledgeValidationRule,
} from "@knowledgeprism/constants";
import { z } from "zod";

import { knowledgeDocumentParentId } from "./knowledge-document-parent-id.validation-schema.js";

const knowledgeDocumentCreate = z
	.object({
		parentId: knowledgeDocumentParentId,
		title: z
			.string({ error: KnowledgeValidationMessage.TITLE_EMPTY })
			.trim()
			.min(KnowledgeValidationRule.TITLE_MINIMUM_LENGTH, {
				error: KnowledgeValidationMessage.TITLE_EMPTY,
			})
			.max(KnowledgeValidationRule.TITLE_MAXIMUM_LENGTH, {
				error: KnowledgeValidationMessage.TITLE_MAXIMUM_LENGTH,
			}),
	})
	.required();

export { knowledgeDocumentCreate };
