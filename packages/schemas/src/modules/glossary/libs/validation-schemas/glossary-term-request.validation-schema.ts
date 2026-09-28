import {
	GlossaryValidationMessage,
	GlossaryValidationRule,
	ProjectValidationRule,
} from "@knowledgeprism/constants";
import { z } from "zod";

const glossaryTermRequest = z
	.object({
		definition: z
			.string({ error: GlossaryValidationMessage.DEFINITION_EMPTY })
			.trim()
			.min(GlossaryValidationRule.REQUIRED_MINIMUM_LENGTH, {
				error: GlossaryValidationMessage.DEFINITION_EMPTY,
			})
			.max(GlossaryValidationRule.DEFINITION_MAXIMUM_LENGTH, {
				error: GlossaryValidationMessage.DEFINITION_MAXIMUM_LENGTH,
			}),
		name: z
			.string({ error: GlossaryValidationMessage.NAME_EMPTY })
			.trim()
			.min(GlossaryValidationRule.REQUIRED_MINIMUM_LENGTH, {
				error: GlossaryValidationMessage.NAME_EMPTY,
			})
			.max(GlossaryValidationRule.NAME_MAXIMUM_LENGTH, {
				error: GlossaryValidationMessage.NAME_MAXIMUM_LENGTH,
			}),
		relatedTermIds: z
			.array(
				z
					.number({ error: GlossaryValidationMessage.RELATED_TERMS_INVALID })
					.int({ error: GlossaryValidationMessage.RELATED_TERMS_INVALID })
					.positive({ error: GlossaryValidationMessage.RELATED_TERMS_INVALID })
					.max(ProjectValidationRule.DATABASE_ID_MAXIMUM, {
						error: GlossaryValidationMessage.RELATED_TERMS_INVALID,
					}),
				{ error: GlossaryValidationMessage.RELATED_TERMS_INVALID },
			)
			.max(GlossaryValidationRule.RELATED_TERMS_MAXIMUM_COUNT, {
				error: GlossaryValidationMessage.RELATED_TERMS_MAXIMUM_COUNT,
			}),
	})
	.required();

export { glossaryTermRequest };
