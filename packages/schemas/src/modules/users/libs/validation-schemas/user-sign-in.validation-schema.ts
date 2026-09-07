import {
	UserValidationMessage,
	UserValidationRule,
} from "@knowledgeprism/constants";
import { z } from "zod";

import { email } from "./email.validation-schema.js";

const userSignIn = z.object({
	email,
	password: z.string().trim().min(UserValidationRule.PASSWORD_MINIMUM_LENGTH, {
		error: UserValidationMessage.PASSWORD_MINIMUM_LENGTH,
	}),
});

export { userSignIn };
