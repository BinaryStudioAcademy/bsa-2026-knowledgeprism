import { type ReactNode } from "react";
import { Link } from "react-router-dom";

import { useLocation } from "~/hooks/hooks.js";
import { getValidClassNames } from "~/lib/helpers/helpers.js";

import {
	EXPANDED_NAV_ITEM_CLASS,
	RAIL_NAV_ITEM_CLASS,
} from "./libs/constants.js";

type NavItem = {
	icon: ReactNode;
	id: string;
	label: string;
	onNavigate?: (() => void) | undefined;
	to?: string | undefined;
};

type NavRowProperties = NavItem & {
	isExpanded: boolean;
};

type NavTooltipProperties = {
	children: ReactNode;
	isEnabled: boolean;
	label: string;
};

const TOOLTIP_CLASS_NAME =
	"pointer-events-none invisible absolute top-1/2 left-full z-30 ml-2 -translate-y-1/2 rounded-md bg-primary px-2 py-1 text-xs font-medium whitespace-nowrap text-primary-fg opacity-0 shadow-md group-hover/nav:visible group-hover/nav:opacity-100 group-focus-within/nav:visible group-focus-within/nav:opacity-100";

const NavTooltip = ({
	children,
	isEnabled,
	label,
}: NavTooltipProperties): React.JSX.Element => {
	if (!isEnabled) {
		return <>{children}</>;
	}

	return (
		<div className="group/nav relative flex w-full justify-center">
			{children}
			<span
				aria-hidden="true"
				className={TOOLTIP_CLASS_NAME}
				role="presentation"
			>
				{label}
			</span>
		</div>
	);
};

const getNavItemClassName = (
	isActive: boolean,
	isDisabled: boolean,
	isExpanded: boolean,
): string => {
	return getValidClassNames(
		"nav-item",
		isExpanded ? EXPANDED_NAV_ITEM_CLASS : RAIL_NAV_ITEM_CLASS,
		{
			"is-active": isActive,
		},
		isDisabled && "cursor-not-allowed opacity-40 hover:bg-transparent",
	);
};

const NavRow = ({
	icon,
	isExpanded,
	label,
	onNavigate,
	to,
}: NavRowProperties): React.JSX.Element => {
	const { pathname } = useLocation();
	const isActive = Boolean(to) && pathname === to;
	const className = getNavItemClassName(isActive, !to, isExpanded);
	const accessibleName = isExpanded ? {} : { "aria-label": label };

	return (
		<NavTooltip isEnabled={!isExpanded} label={label}>
			{to ? (
				<Link
					aria-current={isActive ? "page" : undefined}
					className={className}
					onClick={onNavigate}
					to={to}
					{...accessibleName}
				>
					{icon}
					{isExpanded && <span>{label}</span>}
				</Link>
			) : (
				<button
					className={className}
					disabled
					type="button"
					{...accessibleName}
				>
					{icon}
					{isExpanded && <span>{label}</span>}
				</button>
			)}
		</NavTooltip>
	);
};

export { type NavItem, NavRow, NavTooltip };
