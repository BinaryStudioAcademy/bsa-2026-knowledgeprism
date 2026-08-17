import {
	UserValidationMessage,
	UserValidationRule,
} from "@knowledgeprism/constants";
import { z } from "zod";

const userSignUp = z
	.object({
		email: z
			.string()
			.trim()
			.min(UserValidationRule.EMAIL_MINIMUM_LENGTH, {
				error: UserValidationMessage.EMAIL_REQUIRE,
			})
			.pipe(
				z.email({
					error: UserValidationMessage.EMAIL_WRONG,
				}),
			),
		password: z.string().trim(),
	})
	.required();

export { userSignUp };
