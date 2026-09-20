import { OrganisationRole } from "@knowledgeprism/constants";
import { Navigate, Outlet } from "react-router-dom";

import { Loader } from "~/components/components.js";
import { useAppSelector } from "~/hooks/hooks.js";
import { AppRoute, DataStatus } from "~/lib/enums/enums.js";

const AdminRoute: React.FC = () => {
	const { dataStatus, user } = useAppSelector((state) => ({
		dataStatus: state.auth.dataStatus,
		user: state.auth.user,
	}));

	if (dataStatus === DataStatus.PENDING || dataStatus === DataStatus.IDLE) {
		return <Loader />;
	}

	if (!user) {
		return <Navigate replace to={AppRoute.SIGN_IN} />;
	}

	if (user.user.organisationRole !== OrganisationRole.ADMIN) {
		return <Navigate replace to={AppRoute.WORKSPACE} />;
	}

	return <Outlet />;
};

export { AdminRoute };
