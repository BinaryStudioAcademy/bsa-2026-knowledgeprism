import { z } from "zod";
// i will remove this at this moment write for fixed error
const MIN_PROJECT_NAME_LENGTH = 1;
const ProjectFormValidationSchema = z.object({
	description: z.string().optional(),
	projectName: z
		.string()
		.min(MIN_PROJECT_NAME_LENGTH, "Project name is required"),
});
export { ProjectFormValidationSchema };
