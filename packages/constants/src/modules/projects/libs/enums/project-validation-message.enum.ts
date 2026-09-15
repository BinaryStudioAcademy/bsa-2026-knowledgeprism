const ProjectValidationMessage = {
	ACCESS_FORBIDDEN: "You do not have permission to perform this action",
	HAS_DOCUMENTS: "Cannot delete a project that contains documents",
	ID_WRONG: "Project ID must be a positive integer",
	MEMBER_ALREADY_EXISTS: "User is already a project member",
	MEMBER_ROLE_WRONG: "Project member role is invalid",
	NAME_MAXIMUM_LENGTH: "Project name must be at most 50 characters long",
	NAME_REQUIRE: "Project name is required",
	NOT_FOUND: "Project not found",
	UPDATE_REQUIRE: "At least one project field must be provided",
} as const;

export { ProjectValidationMessage };
