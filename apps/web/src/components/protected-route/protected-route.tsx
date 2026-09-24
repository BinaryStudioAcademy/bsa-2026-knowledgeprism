import { Navigate, Outlet } from "react-router-dom";

import { Loader } from "~/components/components.js";
import { useAppSelector, useLocation } from "~/hooks/hooks.js";
import { AppRoute } from "~/lib/enums/enums.js";

const ProtectedRoute: React.FC = () => {
	const hasUser = useAppSelector(({ auth }) => Boolean(auth.user));
	const isInitialized = useAppSelector(({ auth }) => auth.isInitialized);

	const { pathname, search } = useLocation();

	if (!isInitialized) {
		return <Loader />;
	}

	if (!hasUser) {
		return (
			<Navigate
				replace
				state={{ from: `${pathname}${search}` }}
				to={AppRoute.SIGN_IN}
			/>
		);
	}

	return <Outlet />;
};

export { ProtectedRoute };
