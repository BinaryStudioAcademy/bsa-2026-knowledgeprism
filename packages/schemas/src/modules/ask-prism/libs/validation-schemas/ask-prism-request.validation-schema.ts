import { z } from "zod";

const askPrismRequestValidationSchema = z
	.object({
		query: z.string().trim().min(1, { message: "Query must not be empty" }),
	})
	.required();

export { askPrismRequestValidationSchema };
