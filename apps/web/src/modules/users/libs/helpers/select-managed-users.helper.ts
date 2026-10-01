import { OrganisationRole } from "@knowledgeprism/constants";

const EMPTY_ASSIGNMENT_LENGTH = 0;

type ManagedUser = {
	assignedProjects: {
		projectId: number;
	}[];
	id: number;
	organisationRole: null | string;
};

type ManagedUserScope = {
	currentUserId: null | number;
	isCurrentUserOrganisationAdmin: boolean;
	projectIds: null | ReadonlySet<string>;
	selectedProjectId: null | string;
};

const isListedOrganisationAdmin = (
	user: ManagedUser,
	scope: ManagedUserScope,
): boolean => {
	if (user.organisationRole === OrganisationRole.ADMIN) {
		return true;
	}

	return (
		scope.isCurrentUserOrganisationAdmin &&
		scope.currentUserId !== null &&
		user.id === scope.currentUserId
	);
};

const isAssignedToProject = (user: ManagedUser, projectId: string): boolean => {
	return user.assignedProjects.some((assignment) => {
		return String(assignment.projectId) === projectId;
	});
};

const isInsideKnownProjects = (
	user: ManagedUser,
	projectIds: ReadonlySet<string>,
): boolean => {
	return user.assignedProjects.some((assignment) => {
		return projectIds.has(String(assignment.projectId));
	});
};

const selectManagedUsers = <TUser extends ManagedUser>(
	users: TUser[],
	scope: ManagedUserScope,
): TUser[] => {
	return users.filter((user) => {
		if (isListedOrganisationAdmin(user, scope)) {
			return true;
		}

		if (scope.selectedProjectId) {
			return isAssignedToProject(user, scope.selectedProjectId);
		}

		if (scope.projectIds === null) {
			return user.assignedProjects.length > EMPTY_ASSIGNMENT_LENGTH;
		}

		return isInsideKnownProjects(user, scope.projectIds);
	});
};

export { selectManagedUsers };
