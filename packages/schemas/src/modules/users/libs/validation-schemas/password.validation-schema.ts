import {
	UserValidationMessage,
	UserValidationRule,
} from "@knowledgeprism/constants";
import { z } from "zod";

const password = z
	.string()
	.min(UserValidationRule.PASSWORD_MINIMUM_LENGTH, {
		error: UserValidationMessage.PASSWORD_MINIMUM_LENGTH,
	})
	.max(UserValidationRule.PASSWORD_MAXIMUM_LENGTH, {
		error: UserValidationMessage.PASSWORD_MAXIMUM_LENGTH,
	})
	.regex(/[A-Za-z]/, {
		error: UserValidationMessage.PASSWORD_LETTER_REQUIRE,
	})
	.regex(/\d/, {
		error: UserValidationMessage.PASSWORD_DIGIT_REQUIRE,
	})
	.regex(/[!@#$%^&*(),.?":{}|<>]/, {
		error: UserValidationMessage.PASSWORD_SPECIAL_CHARACTER,
	});

export { password };
