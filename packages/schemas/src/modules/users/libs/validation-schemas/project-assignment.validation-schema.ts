import {
	ProjectMemberRole,
	UserValidationMessage,
} from "@knowledgeprism/constants";
import { z } from "zod";

const projectAssignment = z.object({
	projectId: z.number().int().positive(),
	role: z.enum([ProjectMemberRole.EDITOR, ProjectMemberRole.VIEWER], {
		error: UserValidationMessage.PROJECT_ROLE_WRONG,
	}),
});

export { projectAssignment };
