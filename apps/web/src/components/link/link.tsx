import { NavLink } from "react-router-dom";

import { type AppRoute } from "~/lib/enums/enums.js";
import { type ValueOf } from "~/lib/types/types.js";

type Properties = {
	children: React.ReactNode;
	to: ValueOf<typeof AppRoute>;
};

const Link: React.FC<Properties> = ({ children, to }: Properties) => (
	<NavLink to={to}>{children}</NavLink>
);

export { Link };
