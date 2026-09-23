import { ProjectMemberRole } from "@knowledgeprism/constants";
import React from "react";
import { Link } from "react-router-dom";

import { Button } from "~/components/components.js";
import { Icon } from "~/components/icon/icon.js";
import { useAppSelector, useLocation, useModal } from "~/hooks/hooks.js";
import { AppRoute } from "~/lib/enums/enums.js";
import { getValidClassNames } from "~/lib/helpers/helpers.js";
import { type ValueOf } from "~/lib/types/types.js";
import { AddKnowledgeModal } from "~/modules/knowledge/components/add-knowledge-modal/add-knowledge-modal.js";

const MOBILE_NAV_ICON_SIZE = 16;
const RESPONSIVE_NAV_ITEM_CLASS =
	"tablet:h-8.5 tablet:w-8.5 tablet:justify-center tablet:p-0 desktop:h-auto desktop:w-auto desktop:justify-start desktop:px-3 desktop:py-2.5";

type NavItem = {
	icon: React.ReactNode;
	id: string;
	label: string;
	to?: ValueOf<typeof AppRoute>;
};

type SidebarProperties = {
	projectName: string;
	role: string;
};

const primaryNavItems: NavItem[] = [
	{
		icon: <Icon name="knowledge-tree" />,
		id: "knowledge-tree",
		label: "Knowledge Tree",
		to: AppRoute.KNOWLEDGE_TREE,
	},
	{
		icon: <Icon name="glossary" />,
		id: "glossary",
		label: "Glossary",
		to: AppRoute.GLOSSARY,
	},
	{
		icon: <Icon name="ask-prism" />,
		id: "ask-prism",
		label: "Ask Prism",
		to: AppRoute.ASK_PRISM,
	},
];

const utilityNavItems: NavItem[] = [
	{
		icon: <Icon name="settings" />,
		id: "settings",
		label: "Settings",
		to: AppRoute.SETTINGS,
	},
	{
		icon: <Icon name="users" />,
		id: "users",
		label: "Users",
		to: AppRoute.USERS,
	},
];

const mobileNavItems: NavItem[] = [
	{
		icon: <Icon name="knowledge-tree" size={MOBILE_NAV_ICON_SIZE} />,
		id: "knowledge-tree",
		label: "Tree",
		to: AppRoute.KNOWLEDGE_TREE,
	},
	{
		icon: <Icon name="glossary" size={MOBILE_NAV_ICON_SIZE} />,
		id: "glossary",
		label: "Glossary",
		to: AppRoute.GLOSSARY,
	},
	{
		icon: <Icon name="ask-prism" size={MOBILE_NAV_ICON_SIZE} />,
		id: "ask-prism",
		label: "Ask",
		to: AppRoute.ASK_PRISM,
	},
];

const NavRow = ({ icon, label, to }: NavItem) => {
	const { pathname } = useLocation();
	const isActive = Boolean(to) && pathname === to;

	const className = getValidClassNames("nav-item", RESPONSIVE_NAV_ITEM_CLASS, {
		"is-active": isActive,
	});

	if (to) {
		return (
			<Link
				aria-current={isActive ? "page" : undefined}
				className={className}
				to={to}
			>
				{icon}
				<span className="hidden desktop:inline">{label}</span>
			</Link>
		);
	}

	return (
		<button className={className} type="button">
			{icon}
			<span className="hidden desktop:inline">{label}</span>
		</button>
	);
};

const Sidebar: React.FC<SidebarProperties> = ({
	projectName,
	role,
}: SidebarProperties) => {
	const { hideModal, isOpen, showModal } = useModal();
	const { isAddingKnowledge } = useAppSelector((state) => state.knowledge);

	const canAddKnowledge = role !== ProjectMemberRole.VIEWER;

	return (
		<aside className="hidden h-full tablet:flex tablet:w-14 desktop:w-58 flex-shrink-0 flex-col gap-5 border-r border-border bg-surface px-3.5 py-5">
			<nav className="flex flex-col gap-0.5">
				{primaryNavItems.map((item) => (
					<NavRow key={item.id} {...item} />
				))}
			</nav>

			<div className="mt-auto flex flex-col gap-2.5 border-t border-border-subtle pt-3.5">
				{canAddKnowledge && (
					<>
						<Button
							className={getValidClassNames(
								"inline-flex",
								RESPONSIVE_NAV_ITEM_CLASS,
							)}
							disabled={isAddingKnowledge}
							onClick={showModal}
							variant="accent"
						>
							<Icon name="plus" size={16} />
							<span className="hidden desktop:inline">Add Knowledge</span>
						</Button>
						<AddKnowledgeModal
							isOpen={isOpen}
							onClose={hideModal}
							projectName={projectName}
						/>
					</>
				)}
				<div className="flex flex-col gap-0.5">
					{utilityNavItems.map((item) => (
						<NavRow key={item.id} {...item} />
					))}
				</div>
			</div>
		</aside>
	);
};

const MobileNavRow = ({ icon, label, to }: NavItem) => {
	const { pathname } = useLocation();
	const isActive = Boolean(to) && pathname === to;

	const className = getValidClassNames(
		"flex flex-1 flex-col items-center gap-0.75 py-2.25 text-2xs border-none bg-transparent cursor-pointer font-sans",
		{ "text-accent": isActive, "text-text-muted": !isActive },
	);

	if (to) {
		return (
			<Link
				aria-current={isActive ? "page" : undefined}
				className={className}
				to={to}
			>
				{icon}
				{label}
			</Link>
		);
	}

	return (
		<button className={className} type="button">
			{icon}
			{label}
		</button>
	);
};

const MobileNav: React.FC = () => {
	return (
		<nav className="flex flex-shrink-0 tablet:hidden border-t border-border bg-surface">
			{mobileNavItems.map((item) => (
				<MobileNavRow key={item.id} {...item} />
			))}
		</nav>
	);
};
export { MobileNav, Sidebar };
