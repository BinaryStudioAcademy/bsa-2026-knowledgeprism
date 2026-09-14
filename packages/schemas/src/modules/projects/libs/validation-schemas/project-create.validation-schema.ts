import {
	ProjectValidationMessage,
	ProjectValidationRule,
} from "@knowledgeprism/constants";
import { z } from "zod";

const projectCreate = z.object({
	description: z.string().trim().optional(),
	name: z
		.string({
			error: ProjectValidationMessage.NAME_REQUIRE,
		})
		.trim()
		.min(ProjectValidationRule.NAME_MINIMUM_LENGTH, {
			error: ProjectValidationMessage.NAME_REQUIRE,
		})
		.max(ProjectValidationRule.NAME_MAXIMUM_LENGTH, {
			error: ProjectValidationMessage.NAME_MAXIMUM_LENGTH,
		}),
});

export { projectCreate };
