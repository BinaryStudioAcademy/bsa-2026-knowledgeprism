import { z } from "zod";

const MIN_LENGTH = 1;
const MAX_TITLE_LENGTH = 255;

const blockSchema = z.record(z.string(), z.unknown());

const kbEntryValidationSchema = z.object({
	contentJson: z
		.array(blockSchema)
		.min(MIN_LENGTH, { message: "Content cannot be empty" }),
	title: z
		.string()
		.trim()
		.min(MIN_LENGTH, { message: "Title cannot be empty" })
		.max(MAX_TITLE_LENGTH, { message: "Title cannot exceed 255 characters" }),
});

export { kbEntryValidationSchema };
