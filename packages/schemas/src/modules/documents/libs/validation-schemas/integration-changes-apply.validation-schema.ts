import {
	DocumentValidationMessage,
	DocumentValidationRule,
	IntegrationResolution,
} from "@knowledgeprism/constants";
import { z } from "zod";

import { reviewContentBlock } from "./extraction-items-review.validation-schema.js";

const minimumTextLength = 1;
const minimumTitleLength = 1;
const textMaximumLength = 50_000;
const titleMaximumLength = 255;

const contentResolution = z.enum([
	IntegrationResolution.BOTH,
	IntegrationResolution.KEEP,
	IntegrationResolution.USE_NEW,
]);

const titleResolution = z.enum([
	IntegrationResolution.KEEP,
	IntegrationResolution.USE_NEW,
]);

const conflictResolution = z.object({
	changeId: z.number().int().positive(),
	content: contentResolution,
	matchIndex: z.number().int().nonnegative().optional(),
	title: titleResolution,
});

const publishedItem = z.object({
	blocks: z.array(reviewContentBlock).optional(),
	id: z.number().int().positive(),
	text: z.string().trim().min(minimumTextLength).max(textMaximumLength),
	title: z.string().trim().min(minimumTitleLength).max(titleMaximumLength),
});

const contentOverride = z
	.object({
		changeId: z.number().int().positive(),
		content: z
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
	})
	.required();

const placement = z
	.object({
		changeId: z.number().int().positive(),
		parentId: z.number().int().positive().nullable(),
		position: z.number().int().nonnegative(),
	})
	.required()
	.extend({
		parentExtractionItemId: z.number().int().positive().nullable().optional(),
	})
	.refine(
		(value) => value.parentId === null || value.parentExtractionItemId == null,
		{
			message: DocumentValidationMessage.PLACEMENT_PARENT_AMBIGUOUS,
			path: ["parentExtractionItemId"],
		},
	);

const integrationChangesApply = z
	.object({
		contentOverrides: z.array(contentOverride),
		items: z.array(publishedItem),
		resolutions: z.array(conflictResolution),
	})
	.required()
	.extend({ placements: z.array(placement).optional() });

export { integrationChangesApply };
