import { UserValidationMessage } from "@knowledgeprism/constants";
import { userCreateValidationSchema } from "@knowledgeprism/schemas";
import { z } from "zod";

const userCreateFrontendValidationSchema = userCreateValidationSchema
	.extend({ confirmPassword: z.string() })
	.superRefine(({ confirmPassword, password }, context) => {
		if (confirmPassword !== password) {
			context.addIssue({
				code: "custom",
				message: UserValidationMessage.PASSWORDS_MISMATCH,
				path: ["confirmPassword"],
			});
		}
	});

export { userCreateFrontendValidationSchema };
