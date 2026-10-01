import {
	DocumentValidationMessage,
	DocumentValidationRule,
} from "@knowledgeprism/constants";
import { z } from "zod";

const itemIdentifiers = z.array(z.number().int().positive());
const minimumSectionItems = 1;

const reviewSectionItem = z.object({
	id: z.number().int().positive().optional(),
	text: z
		.string()
		.trim()
		.min(DocumentValidationRule.CONTENT_MINIMUM_LENGTH, {
			message: DocumentValidationMessage.TEXT_REQUIRED,
		})
		.max(DocumentValidationRule.CONTENT_MAXIMUM_LENGTH, {
			message: DocumentValidationMessage.CONTENT_MAXIMUM_LENGTH,
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
});

const reviewSection = z.object({
	items: z.array(reviewSectionItem).min(minimumSectionItems),
	title: z
		.string()
		.trim()
		.min(DocumentValidationRule.CONTENT_MINIMUM_LENGTH, {
			message: DocumentValidationMessage.TITLE_REQUIRED,
		})
		.max(DocumentValidationRule.TITLE_MAXIMUM_LENGTH, {
			message: DocumentValidationMessage.TITLE_MAXIMUM_LENGTH,
		}),
});

const extractionItemsReview = z.object({
	approvedIds: itemIdentifiers,
	rejectedIds: itemIdentifiers,
	sections: z.array(reviewSection).optional(),
});

export { extractionItemsReview };
