const ProjectValidationRule = {
	DATABASE_ID_MAXIMUM: 2_147_483_647,
	NAME_MAXIMUM_LENGTH: 50,
	NAME_MINIMUM_LENGTH: 1,
} as const;

export { ProjectValidationRule };
