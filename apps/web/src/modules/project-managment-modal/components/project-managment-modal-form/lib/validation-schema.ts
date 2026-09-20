import {
	ProjectValidationMessage,
	ProjectValidationRule,
} from "@knowledgeprism/constants";
import { z } from "zod";

const ProjectFormValidationSchema = z.object({
	description: z.string().trim().optional(),

	projectName: z
		.string()
		.trim()
		.min(ProjectValidationRule.NAME_MINIMUM_LENGTH, {
			error: ProjectValidationMessage.NAME_REQUIRE,
		})
		.max(ProjectValidationRule.NAME_MAXIMUM_LENGTH, {
			error: ProjectValidationMessage.NAME_MAXIMUM_LENGTH,
		}),
});

export { ProjectFormValidationSchema };
