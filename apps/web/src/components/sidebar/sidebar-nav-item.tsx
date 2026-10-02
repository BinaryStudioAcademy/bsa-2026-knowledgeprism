import { type MouseEvent, type ReactNode, useCallback, useState } from "react";
import { createPortal } from "react-dom";
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

const TOOLTIP_EDGE_GAP_PX = 8;
const TOOLTIP_VERTICAL_CENTER_RATIO = 0.5;
const TOOLTIP_CLASS_NAME =
	"pointer-events-none fixed z-50 -translate-y-1/2 rounded-md bg-primary px-2 py-1 text-xs font-medium whitespace-nowrap text-primary-fg shadow-md";

type TooltipPosition = {
	left: number;
	top: number;
};

const readTooltipPosition = (element: HTMLElement): TooltipPosition => {
	const bounds = element.getBoundingClientRect();

	return {
		left: bounds.right + TOOLTIP_EDGE_GAP_PX,
		top: bounds.top + bounds.height * TOOLTIP_VERTICAL_CENTER_RATIO,
	};
};

const NavTooltip = ({
	children,
	isEnabled,
	label,
}: NavTooltipProperties): React.JSX.Element => {
	const [isHovered, setIsHovered] = useState(false);
	const [tooltipPosition, setTooltipPosition] =
		useState<null | TooltipPosition>(null);
	const isTooltipVisible = isEnabled && isHovered;

	const handleMouseEnter = useCallback(
		(event: MouseEvent<HTMLDivElement>): void => {
			setIsHovered(true);
			setTooltipPosition(readTooltipPosition(event.currentTarget));
		},
		[],
	);
	const handleMouseLeave = useCallback((): void => {
		setIsHovered(false);
	}, []);

	if (!isEnabled) {
		return <>{children}</>;
	}

	return (
		<div
			className="relative flex w-full justify-center"
			onMouseEnter={handleMouseEnter}
			onMouseLeave={handleMouseLeave}
		>
			{children}
			{isTooltipVisible &&
				tooltipPosition &&
				createPortal(
					<span
						aria-hidden="true"
						className={TOOLTIP_CLASS_NAME}
						role="presentation"
						style={{
							left: tooltipPosition.left,
							top: tooltipPosition.top,
						}}
					>
						{label}
					</span>,
					document.body,
				)}
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
