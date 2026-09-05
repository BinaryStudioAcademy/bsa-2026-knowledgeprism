import { DocumentValidationRule } from "@knowledgeprism/constants";
import { z } from "zod";

const STORAGE_SAFE_PROJECT_ID_PATTERN = /^[a-zA-Z0-9._-]+$/;

const documentUploadIntentRouteParameters = z
	.object({
		projectId: z
			.string()
			.trim()
			.min(DocumentValidationRule.PROJECT_ID_MINIMUM_LENGTH)
			.max(DocumentValidationRule.PROJECT_ID_MAXIMUM_LENGTH)
			.regex(STORAGE_SAFE_PROJECT_ID_PATTERN),
	})
	.required();

export { documentUploadIntentRouteParameters };
