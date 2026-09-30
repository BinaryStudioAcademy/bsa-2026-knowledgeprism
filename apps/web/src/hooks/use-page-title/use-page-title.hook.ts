import { useEffect } from "react";
import { matchPath, useLocation } from "react-router-dom";

import { AppRoute, DocumentTitle, PageTitle } from "~/lib/enums/enums.js";
import { getUserManagementCopy } from "~/modules/users/libs/constants/user-management-copy.constant.js";
import { getUserManagementProjectId } from "~/modules/users/libs/helpers/user-management-project.helper.js";

type RouteKey = keyof typeof AppRoute;

const getPageTitle = (pathname: string, search: string): string => {
	if (pathname === AppRoute.USERS) {
		const title = getUserManagementCopy(
			getUserManagementProjectId(search) !== null,
		).TITLE;

		return `${title}${DocumentTitle.SEPARATOR}${DocumentTitle.APP_NAME}`;
	}

	const routeKey = (Object.keys(AppRoute) as RouteKey[]).find((key) =>
		matchPath(AppRoute[key], pathname),
	);

	const pageTitle = routeKey ? PageTitle[routeKey] : null;

	if (!pageTitle) {
		return DocumentTitle.APP_NAME;
	}

	return `${pageTitle}${DocumentTitle.SEPARATOR}${DocumentTitle.APP_NAME}`;
};

const usePageTitle = (): void => {
	const { pathname, search } = useLocation();

	useEffect(() => {
		document.title = getPageTitle(pathname, search);
	}, [pathname, search]);
};

export { usePageTitle };
