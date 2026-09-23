import { UserValidationMessage } from "@knowledgeprism/constants";
import {
	passwordValidationSchema,
	userUpdateValidationSchema,
} from "@knowledgeprism/schemas";
import { z } from "zod";

const assignedProjectSchema = z.object({
	projectId: z.number(),
	role: z.enum(["EDITOR", "VIEWER"]),
});

const userUpdateFrontendValidationSchema = userUpdateValidationSchema
	.extend({
		assignedProjects: z.array(assignedProjectSchema).optional(),
		confirmPassword: z.string().optional(),
		isActive: z.boolean().optional(),
		password: z.union([z.literal(""), passwordValidationSchema]),
	})
	.superRefine(({ confirmPassword, password }, context) => {
		if (password && password !== confirmPassword) {
			context.addIssue({
				code: "custom",
				message: UserValidationMessage.PASSWORDS_MISMATCH,
				path: ["confirmPassword"],
			});
		}
	});

export { userUpdateFrontendValidationSchema };
