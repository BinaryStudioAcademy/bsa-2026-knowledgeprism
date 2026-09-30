import { OrganisationRole } from "@knowledgeprism/constants";

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
		if (scope.selectedProjectId === null) {
			if (scope.isCurrentUserOrganisationAdmin) {
				return true;
			}

			if (user.organisationRole === OrganisationRole.ADMIN) {
				return true;
			}

			if (scope.currentUserId !== null && user.id === scope.currentUserId) {
				return true;
			}

			if (scope.projectIds === null) {
				return false;
			}

			return isInsideKnownProjects(user, scope.projectIds);
		}

		if (isListedOrganisationAdmin(user, scope)) {
			return true;
		}

		return isAssignedToProject(user, scope.selectedProjectId);
	});
};

export { selectManagedUsers };
