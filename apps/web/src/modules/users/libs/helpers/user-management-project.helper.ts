import { AppRoute } from "~/lib/enums/enums.js";

const USER_MANAGEMENT_PROJECT_QUERY = "projectId";

const isUserManagementPath = (pathname: string): boolean => {
	return (
		pathname === AppRoute.USERS || pathname.startsWith(`${AppRoute.USERS}/`)
	);
};

const isWorkspaceListPath = (pathname: string): boolean => {
	return (
		pathname === AppRoute.WORKSPACES || pathname === `${AppRoute.WORKSPACES}/`
	);
};

const getUserManagementProjectId = (search: string): null | string => {
	const projectId = new URLSearchParams(search).get(
		USER_MANAGEMENT_PROJECT_QUERY,
	);

	if (!projectId) {
		return null;
	}

	return projectId;
};

const buildUserManagementPath = (projectId: null | string): string => {
	if (!projectId) {
		return AppRoute.USERS;
	}

	const search = new URLSearchParams({
		[USER_MANAGEMENT_PROJECT_QUERY]: projectId,
	});

	return `${AppRoute.USERS}?${search.toString()}`;
};

const buildUserCreationPath = (projectId: null | string): string => {
	if (!projectId) {
		return AppRoute.USERS_NEW;
	}

	const search = new URLSearchParams({
		[USER_MANAGEMENT_PROJECT_QUERY]: projectId,
	});

	return `${AppRoute.USERS_NEW}?${search.toString()}`;
};

const resolveSelectedProjectId = ({
	fallbackProjectId,
	pathname,
	search,
}: {
	fallbackProjectId: null | string;
	pathname: string;
	search: string;
}): null | string => {
	if (isWorkspaceListPath(pathname)) {
		return null;
	}

	if (isUserManagementPath(pathname)) {
		return getUserManagementProjectId(search);
	}

	return fallbackProjectId;
};

export {
	buildUserCreationPath,
	buildUserManagementPath,
	getUserManagementProjectId,
	isUserManagementPath,
	resolveSelectedProjectId,
};
