import { UserValidationRule } from "@knowledgeprism/constants";
import { userUpdateValidationSchema } from "@knowledgeprism/schemas";
import { z } from "zod";

const passwordSchema = z
	.string()
	.min(UserValidationRule.PASSWORD_MINIMUM_LENGTH)
	.max(UserValidationRule.PASSWORD_MAXIMUM_LENGTH);

const assignedProjectSchema = z.object({
	projectId: z.number(),
	role: z.enum(["EDITOR", "VIEWER"]),
});

const userUpdateFrontendValidationSchema = userUpdateValidationSchema.extend({
	assignedProjects: z.array(assignedProjectSchema).optional(),
	isActive: z.boolean().optional(),
	password: passwordSchema.optional().or(z.literal("")),
});

export { userUpdateFrontendValidationSchema };
