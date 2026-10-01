import {
	ProjectValidationRule,
	UserValidationMessage,
} from "@knowledgeprism/constants";
import { z } from "zod";

const POSITIVE_INTEGER_PATTERN = /^[1-9]\d*$/u;

const userRouteParameters = z
	.object({
		id: z
			.string()
			.regex(POSITIVE_INTEGER_PATTERN, {
				error: UserValidationMessage.ID_WRONG,
			})
			.refine(
				(value) =>
					Number.isSafeInteger(Number(value)) &&
					Number(value) <= ProjectValidationRule.DATABASE_ID_MAXIMUM,
				{
					error: UserValidationMessage.ID_WRONG,
				},
			),
	})
	.required();

export { userRouteParameters };
