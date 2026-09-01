const AuthValidationMessage = {
	FIRST_NAME_REQUIRE: "First name is required",
	LAST_NAME_REQUIRE: "Last name is required",
	ORGANISATION_NAME_REQUIRE: "Organisation name is required",
	TOKEN_MINIMUM_LENGTH: "Token must be at least 1 character long",
	TOKEN_REQUIRE: "Token is required",
	UNAUTHORIZED: "Unauthorized",
} as const;

export { AuthValidationMessage };
