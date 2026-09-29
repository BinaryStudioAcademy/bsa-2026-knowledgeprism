import { useEffect } from "react";
import { matchPath, useLocation } from "react-router-dom";

import { AppRoute, DocumentTitle, PageTitle } from "~/lib/enums/enums.js";

type RouteKey = keyof typeof AppRoute;

const getPageTitle = (pathname: string): string => {
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
	const { pathname } = useLocation();

	useEffect(() => {
		document.title = getPageTitle(pathname);
	}, [pathname]);
};

export { usePageTitle };
