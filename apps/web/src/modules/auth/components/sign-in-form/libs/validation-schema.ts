import { userSignInValidationSchema } from "@knowledgeprism/schemas";
import { z } from "zod";

const signInFormValidationSchema = z
	.object({
		rememberMe: z.boolean().optional(),
	})
	.and(userSignInValidationSchema);
export { signInFormValidationSchema };
