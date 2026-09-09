import { z } from "zod";

const MIN_LENGTH = 1;
const MAX_TITLE_LENGTH = 255;

const kbEntryValidationSchema = z.object({
	content: z
		.string()
		.trim()
		.min(MIN_LENGTH, { message: "Content cannot be empty" }),
	title: z
		.string()
		.trim()
		.min(MIN_LENGTH, { message: "Title cannot be empty" })
		.max(MAX_TITLE_LENGTH, { message: "Title cannot exceed 255 characters" }),
});

export { kbEntryValidationSchema };
