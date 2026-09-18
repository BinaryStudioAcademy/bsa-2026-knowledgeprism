import {
	KnowledgeValidationMessage,
	ProjectValidationRule,
} from "@knowledgeprism/constants";
import { z } from "zod";

import { projectRouteParameters } from "../../../projects/libs/validation-schemas/project-route-parameters.validation-schema.js";

const POSITIVE_INTEGER_PATTERN = /^[1-9]\d*$/u;

const knowledgeEntryRouteParameters = z
	.object({
		id: z
			.string()
			.trim()
			.regex(POSITIVE_INTEGER_PATTERN, {
				error: KnowledgeValidationMessage.ID_WRONG,
			})
			.refine(
				(value) =>
					Number.isSafeInteger(Number(value)) &&
					Number(value) <= ProjectValidationRule.DATABASE_ID_MAXIMUM,
				{
					error: KnowledgeValidationMessage.ID_WRONG,
				},
			),
		projectId: projectRouteParameters.shape.id,
	})
	.required();

export { knowledgeEntryRouteParameters };
