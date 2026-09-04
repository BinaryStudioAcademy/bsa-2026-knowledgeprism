import { userSignInValidationSchema } from "@knowledgeprism/schemas";
import { z } from "zod";

const signInFormValidationSchema = z
	.object({
		rememeberMe: z.boolean().optional(),
	})
	.and(userSignInValidationSchema);
export { signInFormValidationSchema };
