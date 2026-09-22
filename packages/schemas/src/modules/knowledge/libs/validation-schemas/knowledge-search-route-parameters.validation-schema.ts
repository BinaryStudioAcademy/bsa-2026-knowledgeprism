import { z } from "zod";

const knowledgeSearchRouteParametersValidationSchema = z.object({
	projectId: z.string().regex(/^\d+$/),
});

export { knowledgeSearchRouteParametersValidationSchema };
