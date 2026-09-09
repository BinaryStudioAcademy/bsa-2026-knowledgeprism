import { UserValidationRule } from "@knowledgeprism/constants";
import { z } from "zod";

import { email } from "./email.validation-schema.js";

const userSignIn = z.object({
	email,
	password: z
		.string()
		.min(UserValidationRule.PASSWORD_MINIMUM_LENGTH, "Password is required."),
});

export { userSignIn };
