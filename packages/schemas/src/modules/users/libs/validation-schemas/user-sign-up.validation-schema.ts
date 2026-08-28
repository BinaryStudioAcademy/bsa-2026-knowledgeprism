import {
	UserValidationMessage,
	UserValidationRule,
} from "@knowledgeprism/constants";
import { z } from "zod";

const userSignUp = z
	.object({
		agreeToTerms: z.literal(true, {
			error: UserValidationMessage.ACCEPT_TERMS_REQUIRED,
		}),
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
