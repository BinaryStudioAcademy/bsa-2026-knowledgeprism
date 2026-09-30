import { z } from "zod";

const itemIdentifiers = z.array(z.number().int().positive());
const minimumSectionItems = 1;
const minimumTextLength = 1;
const minimumTitleLength = 1;
const textMaximumLength = 50_000;
const titleMaximumLength = 255;

const reviewSectionItem = z.object({
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

export { extractionItemsReview };
