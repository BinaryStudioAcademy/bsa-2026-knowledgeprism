import {
	ProjectMemberRole,
	ProjectValidationMessage,
	ProjectValidationRule,
} from "@knowledgeprism/constants";
import { z } from "zod";

const projectMemberCreate = z
	.object({
		role: z.enum([ProjectMemberRole.EDITOR, ProjectMemberRole.VIEWER], {
			error: ProjectValidationMessage.MEMBER_ROLE_WRONG,
		}),
		userId: z
			.number()
			.int()
			.positive()
			.max(ProjectValidationRule.DATABASE_ID_MAXIMUM),
	})
	.required();

export { projectMemberCreate };
