import { z } from "zod";

const MIN_PROJECT_NAME_LENGTH = 1;
const ProjectFormValidationSchema = z.object({
	description: z.string().optional(),
	projectName: z
		.string()
		.min(MIN_PROJECT_NAME_LENGTH, "Project name is required"),
});
export { ProjectFormValidationSchema };
