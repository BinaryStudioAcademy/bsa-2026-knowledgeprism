import {
	KnowledgeValidationMessage,
	ProjectValidationRule,
} from "@knowledgeprism/constants";
import { z } from "zod";

const knowledgeDocumentParentId = z
	.number({ error: KnowledgeValidationMessage.PARENT_ID_WRONG })
	.int({ error: KnowledgeValidationMessage.PARENT_ID_WRONG })
	.positive({ error: KnowledgeValidationMessage.PARENT_ID_WRONG })
	.max(ProjectValidationRule.DATABASE_ID_MAXIMUM, {
		error: KnowledgeValidationMessage.PARENT_ID_WRONG,
	})
	.nullable();

export { knowledgeDocumentParentId };
