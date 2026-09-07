import {
	UserValidationMessage,
	UserValidationRule,
} from "@knowledgeprism/constants";
import { z } from "zod";

const projectAssignment = z.object({
	projectId: z.number().int().positive(),
	role: z.enum(["EDITOR", "VIEWER"], {
		error: UserValidationMessage.PROJECT_ROLE_WRONG,
	}),
});

const userUpdate = z.object({
	assignedProjects: z.array(projectAssignment).optional(),
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
		)
		.optional(),
	firstName: z
		.string()
		.trim()
		.min(UserValidationRule.NAME_MINIMUM_LENGTH, {
			error: UserValidationMessage.FIRST_NAME_REQUIRE,
		})
		.max(UserValidationRule.NAME_MAXIMUM_LENGTH, {
			error: UserValidationMessage.FIRST_NAME_REQUIRE,
		})
		.optional(),
	lastName: z
		.string()
		.trim()
		.min(UserValidationRule.NAME_MINIMUM_LENGTH, {
			error: UserValidationMessage.LAST_NAME_REQUIRE,
		})
		.max(UserValidationRule.NAME_MAXIMUM_LENGTH, {
			error: UserValidationMessage.LAST_NAME_REQUIRE,
		})
		.optional(),
	password: z
		.string()
		.min(UserValidationRule.PASSWORD_MINIMUM_LENGTH, {
			error: UserValidationMessage.PASSWORD_MINIMUM_LENGTH,
		})
		.max(UserValidationRule.PASSWORD_MAXIMUM_LENGTH, {
			error: UserValidationMessage.PASSWORD_REQUIRE,
		})
		.regex(/[0-9]/, {
			message: UserValidationMessage.PASSWORD_DIGIT_REQUIRE,
		})
		.regex(/[!@#$%^&*(),.?":{}|<>]/, {
			error: UserValidationMessage.PASSWORD_SPECIAL_CHARACTER,
		})
		.optional(),
	status: z
		.enum(["active", "inactive"], {
			error: UserValidationMessage.STATUS_WRONG,
		})
		.optional(),
});

export { userUpdate };
