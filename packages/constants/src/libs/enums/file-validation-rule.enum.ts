const FileSizeRule = {
	BYTES_IN_KB: 1024,
	MAXIMUM_SIZE_IN_MB: 25,
} as const;

const FileValidationRule = {
	MAXIMUM_FILE_SIZE_IN_BYTES:
		FileSizeRule.MAXIMUM_SIZE_IN_MB *
		FileSizeRule.BYTES_IN_KB *
		FileSizeRule.BYTES_IN_KB,
	MAXIMUM_FILE_SIZE_IN_MB: FileSizeRule.MAXIMUM_SIZE_IN_MB,
} as const;

export { FileValidationRule };
