import { z } from "zod";

const MIN_QUERY_LENGTH = 1;

const askPrismRequestValidationSchema = z
	.object({
		query: z
			.string()
			.trim()
			.min(MIN_QUERY_LENGTH, { message: "Query must not be empty" }),
	})
	.required();

export { askPrismRequestValidationSchema };
