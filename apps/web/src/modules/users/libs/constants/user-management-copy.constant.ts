const OrganisationUserManagementCopy = {
	ADD_BUTTON: "Add new user",
	NAV_LABEL: "Organisation Users",
	SUBTITLE: "Manage users and their access levels within the organisation.",
	TITLE: "Organisation User Management",
} as const;

const ProjectMemberManagementCopy = {
	ADD_BUTTON: "Add new member",
	NAV_LABEL: "Project Members",
	SUBTITLE: "Manage members and their access to this project.",
	TITLE: "Project Member Management",
} as const;

const getUserManagementCopy = (
	hasSelectedProject: boolean,
):
	| typeof OrganisationUserManagementCopy
	| typeof ProjectMemberManagementCopy => {
	return hasSelectedProject
		? ProjectMemberManagementCopy
		: OrganisationUserManagementCopy;
};

export { getUserManagementCopy };
