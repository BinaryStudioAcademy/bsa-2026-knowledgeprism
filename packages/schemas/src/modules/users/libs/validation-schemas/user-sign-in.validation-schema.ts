import { UserValidationRule } from "@knowledgeprism/constants";
import { z } from "zod";

const userSignIn = z.object({
	email: z
		.email("Invalid email address.")
		.min(UserValidationRule.PASSWORD_MINIMUM_LENGTH, "Email is required."),
	password: z
		.string()
		.min(UserValidationRule.PASSWORD_MINIMUM_LENGTH, "Password is required."),
});

export { userSignIn };
