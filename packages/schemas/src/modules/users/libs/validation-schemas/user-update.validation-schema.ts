import {
	UserValidationMessage,
	UserValidationRule,
} from "@knowledgeprism/constants";
import { z } from "zod";

import { email } from "./email.validation-schema.js";
import { password } from "./password.validation-schema.js";

const projectAssignment = z.object({
	projectId: z.number().int().positive(),
	role: z.enum(["EDITOR", "VIEWER"], {
		error: UserValidationMessage.PROJECT_ROLE_WRONG,
	}),
});

const userUpdate = z.object({
	assignedProjects: z.array(projectAssignment).optional(),
	email: email.optional(),
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
	password: password.optional(),
	status: z
		.enum(["active", "inactive"], {
			error: UserValidationMessage.STATUS_WRONG,
		})
		.optional(),
});

export { userUpdate };
