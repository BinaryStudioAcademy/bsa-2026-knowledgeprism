import { userSignUpValidationSchema } from "@knowledgeprism/schemas";
import { z } from "zod";

const SignUpFormValidationMessage = {
	PASSWORDS_MISMATCH: "The passwords entered do not match.",
	TERMS_REQUIRED: "You must accept the Terms & conditions to register.",
} as const;

const signUpFormValidationSchema = z
	.object({
		agreeToTerms: z.literal(true, {
			error: SignUpFormValidationMessage.TERMS_REQUIRED,
		}),
		confirmPassword: z.string(),
	})
	.and(userSignUpValidationSchema)
	.superRefine(({ confirmPassword, password }, context) => {
		if (confirmPassword !== password) {
			context.addIssue({
				code: "custom",
				message: SignUpFormValidationMessage.PASSWORDS_MISMATCH,
				path: ["confirmPassword"],
			});
		}
	});

export { signUpFormValidationSchema };
