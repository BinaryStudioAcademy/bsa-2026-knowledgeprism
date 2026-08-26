import { NavLink } from "react-router-dom";

import { type AppRoute } from "~/lib/enums/enums.js";
import { type ValueOf } from "~/lib/types/types.js";

type Properties = {
	children: React.ReactNode;
	className?: string;
	to: ValueOf<typeof AppRoute>;
};

const Link: React.FC<Properties> = ({ children, className, to }: Properties) => (
	<NavLink className={className ?? ""} to={to}>
		{children}
	</NavLink>
);

export { Link };
