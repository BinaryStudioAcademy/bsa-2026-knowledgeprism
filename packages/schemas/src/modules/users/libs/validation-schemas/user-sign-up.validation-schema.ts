import {
	AuthValidationMessage,
	UserValidationMessage,
	UserValidationRule,
} from "@knowledgeprism/constants";
import { z } from "zod";

import { email } from "./email.validation-schema.js";

const DIGIT_PATTERN = /\d/u;
const NAME_DIGIT_PATTERN = /\d/u;
const SPECIAL_CHARACTER_PATTERN = /[^A-Za-z0-9]/u;

const createRequiredNameField = (
	requiredError: string,
	maximumLengthError: string,
): z.ZodString => {
	return z
		.string()
		.trim()
		.min(UserValidationRule.NAME_MINIMUM_LENGTH, {
			error: requiredError,
		})
		.max(UserValidationRule.NAME_MAXIMUM_LENGTH, {
			error: maximumLengthError,
		});
};

const hasNameDigit = (name: string): boolean => {
	return NAME_DIGIT_PATTERN.test(name);
};

const hasPasswordDigit = (password: string): boolean => {
	return DIGIT_PATTERN.test(password);
};

const hasPasswordSpecialCharacter = (password: string): boolean => {
	return SPECIAL_CHARACTER_PATTERN.test(password);
};

const userSignUp = z
	.object({
		email,
		firstName: createRequiredNameField(
			AuthValidationMessage.FIRST_NAME_REQUIRE,
			AuthValidationMessage.FIRST_NAME_MAXIMUM_LENGTH,
		),
		lastName: createRequiredNameField(
			AuthValidationMessage.LAST_NAME_REQUIRE,
			AuthValidationMessage.LAST_NAME_MAXIMUM_LENGTH,
		),
		organisationName: createRequiredNameField(
			AuthValidationMessage.ORGANISATION_NAME_REQUIRE,
			AuthValidationMessage.ORGANISATION_NAME_MAXIMUM_LENGTH,
		),
		password: z
			.string()
			.trim()
			.min(UserValidationRule.PASSWORD_MINIMUM_LENGTH, {
				error: UserValidationMessage.PASSWORD_MINIMUM_LENGTH,
			})
			.max(UserValidationRule.PASSWORD_MAXIMUM_LENGTH, {
				error: UserValidationMessage.PASSWORD_MAXIMUM_LENGTH,
			}),
	})
	.required()
	.superRefine(({ firstName, lastName, password }, context) => {
		if (hasNameDigit(firstName)) {
			context.addIssue({
				code: "custom",
				message: AuthValidationMessage.FIRST_NAME_DIGIT_WRONG,
				path: ["firstName"],
			});
		}

		if (hasNameDigit(lastName)) {
			context.addIssue({
				code: "custom",
				message: AuthValidationMessage.LAST_NAME_DIGIT_WRONG,
				path: ["lastName"],
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

export { userSignUp };
