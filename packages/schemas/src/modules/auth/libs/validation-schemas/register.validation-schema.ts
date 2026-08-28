import {
	AuthValidationMessage,
	UserValidationMessage,
	UserValidationRule,
} from "@knowledgeprism/constants";
import { z } from "zod";

import { email } from "../../../users/libs/validation-schemas/email.validation-schema.js";

const DIGIT_PATTERN = /\d/u;
const SPECIAL_CHARACTER_PATTERN = /[^A-Za-z0-9]/u;

const hasPasswordDigit = (password: string): boolean => {
	return DIGIT_PATTERN.test(password);
};

const hasPasswordMinimumLength = (password: string): boolean => {
	return password.length >= UserValidationRule.PASSWORD_MINIMUM_LENGTH;
};

const hasPasswordSpecialCharacter = (password: string): boolean => {
	return SPECIAL_CHARACTER_PATTERN.test(password);
};

const register = z
	.object({
		email,
		firstName: z.string().trim().min(UserValidationRule.NAME_MINIMUM_LENGTH, {
			error: AuthValidationMessage.FIRST_NAME_REQUIRE,
		}),
		lastName: z.string().trim().min(UserValidationRule.NAME_MINIMUM_LENGTH, {
			error: AuthValidationMessage.LAST_NAME_REQUIRE,
		}),
		organisationName: z
			.string()
			.trim()
			.min(UserValidationRule.NAME_MINIMUM_LENGTH, {
				error: AuthValidationMessage.ORGANISATION_NAME_REQUIRE,
			}),
		password: z
			.string()
			.trim()
			.min(UserValidationRule.PASSWORD_REQUIRED_LENGTH, {
				error: UserValidationMessage.PASSWORD_REQUIRE,
			}),
	})
	.required()
	.superRefine(({ password }, context) => {
		if (!hasPasswordMinimumLength(password)) {
			context.addIssue({
				code: "custom",
				message: UserValidationMessage.PASSWORD_MINIMUM_LENGTH,
				path: ["password"],
			});
		}

		if (!hasPasswordDigit(password)) {
			context.addIssue({
				code: "custom",
				message: UserValidationMessage.PASSWORD_DIGIT_REQUIRE,
				path: ["password"],
			});
		}

		if (!hasPasswordSpecialCharacter(password)) {
			context.addIssue({
				code: "custom",
				message: UserValidationMessage.PASSWORD_SPECIAL_CHARACTER_REQUIRE,
				path: ["password"],
			});
		}
	});

export { register };
