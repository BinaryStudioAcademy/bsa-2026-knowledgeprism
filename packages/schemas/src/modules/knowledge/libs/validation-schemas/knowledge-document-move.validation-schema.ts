import {
	KnowledgeValidationMessage,
	KnowledgeValidationRule,
} from "@knowledgeprism/constants";
import { z } from "zod";

import { knowledgeDocumentParentId } from "./knowledge-document-parent-id.validation-schema.js";

const knowledgeDocumentMove = z
	.object({
		parentId: knowledgeDocumentParentId,
		position: z
			.number({ error: KnowledgeValidationMessage.DOCUMENT_POSITION_INVALID })
			.int({ error: KnowledgeValidationMessage.DOCUMENT_POSITION_INVALID })
			.min(KnowledgeValidationRule.POSITION_MINIMUM, {
				error: KnowledgeValidationMessage.DOCUMENT_POSITION_INVALID,
			})
			.max(KnowledgeValidationRule.POSITION_MAXIMUM, {
				error: KnowledgeValidationMessage.DOCUMENT_POSITION_INVALID,
			}),
	})
	.required();

export { knowledgeDocumentMove };
