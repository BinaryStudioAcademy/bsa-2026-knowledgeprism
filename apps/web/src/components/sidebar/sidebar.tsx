import React, { useCallback } from "react";

import { Button } from "~/components/components.js";
import { Icon } from "~/components/icon/icon.js";
import { useLocation, useNavigate } from "~/hooks/hooks.js";
import { AppRoute } from "~/lib/enums/enums.js";
import { getValidClassNames } from "~/lib/helpers/helpers.js";

const PROJECT_ICON_SIZE = 18;
const MOBILE_NAV_ICON_SIZE = 16;

type NavItem = {
	icon: React.ReactNode;
	id: string;
	isActive?: boolean;
	label: string;
	onClick?: () => void;
};

type SidebarProperties = {
	projectName: string;
	role: string;
};

const NavRow = ({ icon, isActive, label, onClick }: NavItem) => (
	<button
		aria-current={isActive ? "page" : undefined}
		className={getValidClassNames(
			"nav-item tablet:h-8.5 tablet:w-8.5 tablet:justify-center tablet:p-0 desktop:h-auto desktop:w-auto desktop:justify-start desktop:px-3 desktop:py-2.5",
			{ "is-active": isActive },
		)}
		onClick={onClick}
		type="button"
	>
		{icon}
		<span className="hidden desktop:inline">{label}</span>
	</button>
);

const Sidebar: React.FC<SidebarProperties> = ({
	projectName,
	role,
}: SidebarProperties) => {
	const location = useLocation();
	const navigate = useNavigate();

	const handleNavigate = useCallback(
		(route: string) => (): void => {
			void navigate(route);
		},
		[navigate],
	);

	const isAskPrismActive = location.pathname === AppRoute.ASK_PRISM;
	const isSettingsActive = location.pathname === AppRoute.SETTINGS;

	const primaryNavItems: NavItem[] = [
		{
			icon: <Icon name="knowledge-tree" />,
			id: "knowledge-tree",
			label: "Knowledge Tree",
			onClick: handleNavigate(AppRoute.ROOT),
		},
		{
			icon: <Icon name="glossary" />,
			id: "glossary",
			isActive: !isAskPrismActive && !isSettingsActive,
			label: "Glossary",
			onClick: handleNavigate(AppRoute.ROOT),
		},
		{
			icon: <Icon name="ask-prism" />,
			id: "ask-prism",
			isActive: isAskPrismActive,
			label: "Ask Prism",
			onClick: handleNavigate(AppRoute.ASK_PRISM),
		},
	];

	const utilityNavItems: NavItem[] = [
		{ icon: <Icon name="help" />, id: "help", label: "Help" },
		{
			icon: <Icon name="settings" />,
			id: "settings",
			isActive: isSettingsActive,
			label: "Settings",
			onClick: handleNavigate(AppRoute.SETTINGS),
		},
	];

	return (
		<aside className="hidden tablet:flex tablet:w-14 desktop:w-58 flex-shrink-0 flex-col gap-5 border-r border-border bg-surface px-3.5 py-5">
			<div className="hidden desktop:flex items-center gap-2.5 p-2 text-accent">
				<Icon name="project" size={PROJECT_ICON_SIZE} />
				<div>
					<div className="text-sm font-medium">{projectName}</div>
					<div className="font-mono text-2xs text-text-faint">{role} ROLE</div>
				</div>
			</div>

			<nav className="flex flex-col gap-0.5">
				{primaryNavItems.map((item) => (
					<NavRow key={item.id} {...item} />
				))}
			</nav>

			<div className="hidden desktop:flex mt-auto flex-col gap-2.5 border-t border-border-subtle pt-3.5">
				<Button>Add Knowledge</Button>
				<div className="flex flex-col gap-0.5">
					{utilityNavItems.map((item) => (
						<NavRow key={item.id} {...item} />
					))}
				</div>
			</div>
		</aside>
	);
};

const MobileNav: React.FC = () => {
	const location = useLocation();
	const navigate = useNavigate();

	const isAskPrismActive = location.pathname === AppRoute.ASK_PRISM;

	const handleNavigate = useCallback(
		(route: string) => (): void => {
			void navigate(route);
		},
		[navigate],
	);

	const mobileNavItems: NavItem[] = [
		{
			icon: <Icon name="knowledge-tree" size={MOBILE_NAV_ICON_SIZE} />,
			id: "knowledge-tree",
			label: "Tree",
			onClick: handleNavigate(AppRoute.ROOT),
		},
		{
			icon: <Icon name="glossary" size={MOBILE_NAV_ICON_SIZE} />,
			id: "glossary",
			isActive: !isAskPrismActive,
			label: "Glossary",
			onClick: handleNavigate(AppRoute.ROOT),
		},
		{
			icon: <Icon name="ask-prism" size={MOBILE_NAV_ICON_SIZE} />,
			id: "ask-prism",
			isActive: isAskPrismActive,
			label: "Ask",
			onClick: handleNavigate(AppRoute.ASK_PRISM),
		},
	];

	return (
		<nav className="flex flex-shrink-0 tablet:hidden border-t border-border bg-surface">
			{mobileNavItems.map(({ icon, id, isActive, label, onClick }) => (
				<button
					aria-current={isActive ? "page" : undefined}
					className={getValidClassNames(
						"flex flex-1 flex-col items-center gap-0.75 py-2.25 text-2xs border-none bg-transparent cursor-pointer font-sans",
						{ "text-accent": isActive, "text-text-muted": !isActive },
					)}
					key={id}
					onClick={onClick}
					type="button"
				>
					{icon}
					{label}
				</button>
			))}
		</nav>
	);
};

export { MobileNav, Sidebar };
