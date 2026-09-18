import { z } from "zod";

const askPrismRouteParametersValidationSchema = z
	.object({
		projectId: z.coerce.number().int().positive(),
	})
	.required();

export { askPrismRouteParametersValidationSchema };
