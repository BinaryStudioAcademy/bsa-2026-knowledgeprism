import {
	DocumentValidationMessage,
	DocumentValidationRule,
} from "@knowledgeprism/constants";
import { z } from "zod";

const manualTextCreate = z
	.object({
		content: z
			.string()
			.trim()
			.min(DocumentValidationRule.CONTENT_MINIMUM_LENGTH, {
				message: DocumentValidationMessage.CONTENT_REQUIRED,
			}),
		title: z
			.string()
			.max(DocumentValidationRule.TITLE_MAXIMUM_LENGTH, {
				message: DocumentValidationMessage.TITLE_MAXIMUM_LENGTH,
			})
			.optional(),
	})
	.required({
		content: true,
	});

export { manualTextCreate };
