import { z } from "zod";

import {
	UserValidationMessage,
	UserValidationRule,
} from "@knowledgeprism/constants";

const userCreate = z.object({
	assignedProjects: z
		.array(
			z.object({
				projectId: z.number().int().positive(),
				role: z.enum(["EDITOR", "VIEWER"], {
					error: UserValidationMessage.PROJECT_ROLE_WRONG,
				}),
			}),
		)
		.default([]),
	email: z
		.string()
		.trim()
		.min(UserValidationRule.EMAIL_MINIMUM_LENGTH, {
			error: UserValidationMessage.EMAIL_REQUIRE,
		})
		.max(UserValidationRule.EMAIL_MAXIMUM_LENGTH, {
			error: UserValidationMessage.EMAIL_WRONG,
		})
		.pipe(
			z.email({
				error: UserValidationMessage.EMAIL_WRONG,
			}),
		),
	firstName: z
		.string()
		.trim()
		.min(UserValidationRule.NAME_MINIMUM_LENGTH, {
			error: UserValidationMessage.FIRST_NAME_REQUIRE,
		})
		.max(UserValidationRule.NAME_MAXIMUM_LENGTH, {
			error: UserValidationMessage.FIRST_NAME_REQUIRE,
		}),
	lastName: z
		.string()
		.trim()
		.min(UserValidationRule.NAME_MINIMUM_LENGTH, {
			error: UserValidationMessage.LAST_NAME_REQUIRE,
		})
		.max(UserValidationRule.NAME_MAXIMUM_LENGTH, {
			error: UserValidationMessage.LAST_NAME_REQUIRE,
		}),
	password: z
		.string()
		.min(UserValidationRule.PASSWORD_MINIMUM_LENGTH, {
			error: UserValidationMessage.PASSWORD_MINIMUM_LENGTH,
		})
		.max(UserValidationRule.PASSWORD_MAXIMUM_LENGTH, {
			error: UserValidationMessage.PASSWORD_REQUIRE,
		})
		.regex(/\d/, {
			error: UserValidationMessage.PASSWORD_NUMBER,
		})
		.regex(/[!@#$%^&*(),.?":{}|<>]/, {
			error: UserValidationMessage.PASSWORD_SPECIAL_CHARACTER,
		}),
});

export { userCreate };
