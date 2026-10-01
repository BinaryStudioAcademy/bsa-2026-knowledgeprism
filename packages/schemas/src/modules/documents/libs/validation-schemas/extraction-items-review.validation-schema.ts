import {
	DocumentValidationMessage,
	DocumentValidationRule,
} from "@knowledgeprism/constants";
import { z } from "zod";

const itemIdentifiers = z.array(z.number().int().positive());
const minimumSectionItems = 1;
const nestedHeadingLevel = 3;
const sectionHeadingLevel = 2;

const reviewTextStyle = z.object({
	backgroundColor: z.literal("yellow").optional(),
	bold: z.literal(true).optional(),
});

const reviewInlineContent = z.object({
	styles: reviewTextStyle.optional(),
	text: z.string(),
	type: z.literal("text"),
});

const sectionHeading = z.literal(sectionHeadingLevel);
const nestedHeading = z.literal(nestedHeadingLevel);
const headingLevel = z.union([sectionHeading, nestedHeading]);
const decisionBackground = z.literal("blue");
const noteBackground = z.literal("yellow");
const warningBackground = z.literal("orange");
const calloutBackground = z.union([
	decisionBackground,
	noteBackground,
	warningBackground,
]);
const reviewBlockProperties = z.object({
	backgroundColor: calloutBackground.optional(),
	checked: z.boolean().optional(),
	level: headingLevel.optional(),
});

const reviewContentBlock = z.object({
	content: z.array(reviewInlineContent),
	props: reviewBlockProperties.optional(),
	type: z.enum([
		"bulletListItem",
		"checkListItem",
		"heading",
		"numberedListItem",
		"paragraph",
	]),
});

const reviewSectionItem = z.object({
	blocks: z.array(reviewContentBlock).optional(),
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

export { extractionItemsReview, reviewContentBlock };
