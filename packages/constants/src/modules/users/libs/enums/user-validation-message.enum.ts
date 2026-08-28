const UserValidationMessage = {
	ACCEPT_TERMS_REQUIRED: "You must accept the terms",
	EMAIL_REQUIRE: "Email is required",
	EMAIL_WRONG: "Email is wrong",
	PASSWORD_DIGIT_REQUIRE: "Password must contain at least one digit",
	PASSWORD_MINIMUM_LENGTH: "Password must be at least 8 characters long",
	PASSWORD_REQUIRE: "Password is required",
	PASSWORD_SPECIAL_CHARACTER_REQUIRE:
		"Password must contain at least one special character",
} as const;

export { UserValidationMessage };
