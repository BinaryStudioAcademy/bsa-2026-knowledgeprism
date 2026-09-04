import { DocumentValidationRule } from "@knowledgeprism/constants";
import { z } from "zod";

const STRING_WITHOUT_CONTROL_CHARACTERS_PATTERN = /^[^\p{Cc}]+$/u;

const documentUploadIntent = z
	.object({
		contentType: z.literal("application/pdf"),
		fileName: z
			.string()
			.trim()
			.min(DocumentValidationRule.FILE_NAME_MINIMUM_LENGTH)
			.max(DocumentValidationRule.FILE_NAME_MAXIMUM_LENGTH)
			.regex(STRING_WITHOUT_CONTROL_CHARACTERS_PATTERN),
		sizeInBytes: z
			.number()
			.int()
			.min(DocumentValidationRule.MINIMUM_FILE_SIZE_IN_BYTES)
			.max(DocumentValidationRule.MAXIMUM_FILE_SIZE_IN_BYTES)
			.optional(),
	})
	.required();

export { documentUploadIntent };
