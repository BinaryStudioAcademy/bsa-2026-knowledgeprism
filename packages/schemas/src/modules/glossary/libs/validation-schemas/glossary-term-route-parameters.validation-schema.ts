import {
	GlossaryValidationMessage,
	ProjectValidationRule,
} from "@knowledgeprism/constants";
import { z } from "zod";

import { projectRouteParameters } from "../../../projects/libs/validation-schemas/project-route-parameters.validation-schema.js";

const POSITIVE_INTEGER_PATTERN = /^[1-9]\d*$/u;

const glossaryTermRouteParameters = z
	.object({
		id: z
			.string()
			.regex(POSITIVE_INTEGER_PATTERN, {
				error: GlossaryValidationMessage.ID_WRONG,
			})
			.refine(
				(value) =>
					Number.isSafeInteger(Number(value)) &&
					Number(value) <= ProjectValidationRule.DATABASE_ID_MAXIMUM,
				{
					error: GlossaryValidationMessage.ID_WRONG,
				},
			),
		projectId: projectRouteParameters.shape.id,
	})
	.required();

export { glossaryTermRouteParameters };
