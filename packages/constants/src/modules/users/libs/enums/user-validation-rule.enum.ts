const UserValidationRule = {
	EMAIL_MINIMUM_LENGTH: 1,
	NAME_MINIMUM_LENGTH: 1,
	PASSWORD_MINIMUM_LENGTH: 8,
	PASSWORD_REQUIRED_LENGTH: 1,
} as const;

export { UserValidationRule };
