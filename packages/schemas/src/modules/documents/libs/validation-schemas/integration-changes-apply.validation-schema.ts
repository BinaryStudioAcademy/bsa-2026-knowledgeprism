import {
	DocumentValidationMessage,
	DocumentValidationRule,
	IntegrationResolution,
} from "@knowledgeprism/constants";
import { z } from "zod";

const resolutionChoice = z.enum([
	IntegrationResolution.KEEP,
	IntegrationResolution.USE_NEW,
]);

const conflictResolution = z
	.object({
		changeId: z.number().int().positive(),
		content: resolutionChoice,
		title: resolutionChoice,
	})
	.required();

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

const integrationChangesApply = z
	.object({
		contentOverrides: z.array(contentOverride),
		resolutions: z.array(conflictResolution),
	})
	.required();

export { integrationChangesApply };
