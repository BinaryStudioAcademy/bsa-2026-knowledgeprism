const UserValidationMessage = {
	ACCEPT_TERMS_REQUIRED: "You must accept the terms",
	EMAIL_ALREADY_EXISTS: "Email is already taken",
	EMAIL_REQUIRE: "Email is required",
	EMAIL_WRONG: "Email is wrong",
	FIRST_NAME_REQUIRE: "First name is required",
	LAST_NAME_REQUIRE: "Last name is required",
	PASSWORD_MINIMUM_LENGTH: "Password must be at least 8 characters long",
	PASSWORD_NUMBER: "Password must contain at least one number",
	PASSWORD_REQUIRE: "Password is required",
	PASSWORD_SPECIAL_CHARACTER:
		"Password must contain at least one special character",
	PROJECT_ROLE_REQUIRE: "Project role is required",
	PROJECT_ROLE_WRONG: "Project role is invalid",
	STATUS_REQUIRE: "Status is required",
	STATUS_WRONG: "Status is invalid",
	USER_CANNOT_DEACTIVATE_SELF: "You cannot deactivate your own account",
	USER_CANNOT_REMOVE_SELF_FROM_PROJECTS:
		"You cannot remove yourself from projects",
	USER_CANNOT_UPDATE_EMAIL: "You cannot update your own email",
	USER_CANNOT_UPDATE_STATUS: "You cannot update your own status",
	USER_NOT_FOUND: "User not found",
} as const;

export { UserValidationMessage };
