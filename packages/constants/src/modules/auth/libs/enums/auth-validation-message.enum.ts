const AuthValidationMessage = {
	FIRST_NAME_DIGIT_WRONG: "First name must not contain digits",
	FIRST_NAME_MAXIMUM_LENGTH: "First name must be at most 50 characters long",
	FIRST_NAME_REQUIRE: "First name is required",
	LAST_NAME_DIGIT_WRONG: "Last name must not contain digits",
	LAST_NAME_MAXIMUM_LENGTH: "Last name must be at most 50 characters long",
	LAST_NAME_REQUIRE: "Last name is required",
	ORGANISATION_NAME_MAXIMUM_LENGTH:
		"Organisation name must be at most 50 characters long",
	ORGANISATION_NAME_REQUIRE: "Organisation name is required",
	TOKEN_MINIMUM_LENGTH: "Token must be at least 1 character long",
	TOKEN_REQUIRE: "Token is required",
	UNAUTHORIZED: "Unauthorized",
} as const;

export { AuthValidationMessage };
