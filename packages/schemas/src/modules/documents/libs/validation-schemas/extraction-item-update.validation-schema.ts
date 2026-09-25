import {
	DocumentValidationMessage,
	DocumentValidationRule,
} from "@knowledgeprism/constants";
import { z } from "zod";

const extractionItemUpdate = z
	.object({
		text: z.string().trim().min(DocumentValidationRule.CONTENT_MINIMUM_LENGTH, {
			message: DocumentValidationMessage.TEXT_REQUIRED,
		}),
		title: z
			.string()
			.trim()
			.min(DocumentValidationRule.CONTENT_MINIMUM_LENGTH, {
				message: DocumentValidationMessage.TITLE_REQUIRED,
			})
			.max(DocumentValidationRule.TITLE_MAXIMUM_LENGTH, {
				message: DocumentValidationMessage.TITLE_MAXIMUM_LENGTH,
			}),
	})
	.required();

export { extractionItemUpdate };
