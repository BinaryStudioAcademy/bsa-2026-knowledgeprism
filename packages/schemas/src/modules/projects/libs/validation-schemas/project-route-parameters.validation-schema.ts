import {
	ProjectValidationMessage,
	ProjectValidationRule,
} from "@knowledgeprism/constants";
import { z } from "zod";

const POSITIVE_INTEGER_PATTERN = /^[1-9]\d*$/u;

const projectRouteParameters = z
	.object({
		id: z
			.string()
			.regex(POSITIVE_INTEGER_PATTERN, {
				error: ProjectValidationMessage.ID_WRONG,
			})
			.refine(
				(value) =>
					Number.isSafeInteger(Number(value)) &&
					Number(value) <= ProjectValidationRule.DATABASE_ID_MAXIMUM,
				{
					error: ProjectValidationMessage.ID_WRONG,
				},
			),
	})
	.required();

export { projectRouteParameters };
