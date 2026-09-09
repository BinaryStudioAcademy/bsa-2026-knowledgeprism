const FileSizeRule = {
	BYTES_IN_KB: 1024,
	MAXIMUM_SIZE_IN_MB: 25,
} as const;

const DocumentValidationRule = {
	FILE_NAME_MAXIMUM_LENGTH: 255,
	FILE_NAME_MINIMUM_LENGTH: 1,
	MAXIMUM_FILE_SIZE_IN_BYTES:
		FileSizeRule.MAXIMUM_SIZE_IN_MB *
		FileSizeRule.BYTES_IN_KB *
		FileSizeRule.BYTES_IN_KB,
	MINIMUM_FILE_SIZE_IN_BYTES: 1,
	PROJECT_ID_MAXIMUM_LENGTH: 255,
	PROJECT_ID_MINIMUM_LENGTH: 1,
} as const;

export { DocumentValidationRule };
