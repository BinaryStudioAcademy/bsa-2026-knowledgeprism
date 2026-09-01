import { userSignUpValidationSchema } from "@knowledgeprism/schemas";
import { z } from "zod";

const PASSWORDS_MISMATCH = "The passwords entered do not match.";
const TERMS_REQUIRED = "You must accept the Terms & conditions to register.";

const signUpFormValidationSchema = z
	.object({
		agreeToTerms: z.literal(true, { error: TERMS_REQUIRED }),
		confirmPassword: z.string(),
	})
	.and(userSignUpValidationSchema)
	.superRefine(({ confirmPassword, password }, context) => {
		if (confirmPassword !== password) {
			context.addIssue({
				code: "custom",
				message: PASSWORDS_MISMATCH,
				path: ["confirmPassword"],
			});
		}
	});

export { signUpFormValidationSchema };
