import { z } from "zod";

const itemIdentifiers = z.array(z.number().int().positive());
const minimumSectionItems = 1;
const minimumTextLength = 1;
const minimumTitleLength = 1;
const nestedHeadingLevel = 3;
const sectionHeadingLevel = 2;
const textMaximumLength = 50_000;
const titleMaximumLength = 255;

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
	text: z.string().trim().min(minimumTextLength).max(textMaximumLength),
	title: z.string().trim().min(minimumTitleLength).max(titleMaximumLength),
});

const reviewSection = z.object({
	items: z.array(reviewSectionItem).min(minimumSectionItems),
	title: z.string().trim().min(minimumTitleLength).max(titleMaximumLength),
});

const extractionItemsReview = z.object({
	approvedIds: itemIdentifiers,
	rejectedIds: itemIdentifiers,
	sections: z.array(reviewSection).optional(),
});

export { extractionItemsReview, reviewContentBlock };
