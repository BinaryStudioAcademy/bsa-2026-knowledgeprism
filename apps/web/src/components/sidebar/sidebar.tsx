import { ProjectMemberRole } from "@knowledgeprism/constants";
import React, { useCallback } from "react";
import { generatePath, Link } from "react-router-dom";

import { Button } from "~/components/components.js";
import { Icon } from "~/components/icon/icon.js";
import {
	useAppSelector,
	useLocation,
	useModal,
	useOptionalCurrentProjectId,
} from "~/hooks/hooks.js";
import { AppRoute } from "~/lib/enums/enums.js";
import { getValidClassNames } from "~/lib/helpers/helpers.js";
import { AddKnowledgeModal } from "~/modules/knowledge/components/add-knowledge-modal/add-knowledge-modal.js";

const MOBILE_NAV_ICON_SIZE = 16;
const PROJECT_ICON_SIZE = 18;
const RESPONSIVE_NAV_ITEM_CLASS =
	"tablet:h-8.5 tablet:w-8.5 tablet:justify-center tablet:p-0 desktop:h-auto desktop:w-auto desktop:justify-start desktop:px-3 desktop:py-2.5";

type NavItem = {
	icon: React.ReactNode;
	id: string;
	label: string;
	to?: string | undefined;
};

type SidebarProperties = {
	onAddKnowledge?: () => void;
	projectName: string;
	role: string;
};

const buildProjectLink = (
	projectId: string | undefined,
	route: string,
): string | undefined =>
	projectId ? generatePath(route, { projectId }) : undefined;

const buildPrimaryNavItems = (projectId: string | undefined): NavItem[] => [
	{
		icon: <Icon name="knowledge-tree" />,
		id: "knowledge-tree",
		label: "Knowledge Tree",
		to: buildProjectLink(projectId, AppRoute.PROJECT_KNOWLEDGE_TREE),
	},
	{
		icon: <Icon name="glossary" />,
		id: "glossary",
		label: "Glossary",
		to: buildProjectLink(projectId, AppRoute.PROJECT_GLOSSARY),
	},
	{
		icon: <Icon name="ask-prism" />,
		id: "ask-prism",
		label: "Ask Prism",
		to: buildProjectLink(projectId, AppRoute.PROJECT_ASK_PRISM),
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

const buildMobileNavItems = (projectId: string | undefined): NavItem[] => [
	{
		icon: <Icon name="knowledge-tree" size={MOBILE_NAV_ICON_SIZE} />,
		id: "knowledge-tree",
		label: "Tree",
		to: buildProjectLink(projectId, AppRoute.PROJECT_KNOWLEDGE_TREE),
	},
	{
		icon: <Icon name="glossary" size={MOBILE_NAV_ICON_SIZE} />,
		id: "glossary",
		label: "Glossary",
		to: buildProjectLink(projectId, AppRoute.PROJECT_GLOSSARY),
	},
	{
		icon: <Icon name="ask-prism" size={MOBILE_NAV_ICON_SIZE} />,
		id: "ask-prism",
		label: "Ask",
		to: buildProjectLink(projectId, AppRoute.PROJECT_ASK_PRISM),
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
	onAddKnowledge,
	projectName,
	role,
}: SidebarProperties) => {
	const projectId = useOptionalCurrentProjectId();
	const { hideModal, isOpen, showModal } = useModal();
	const { isAddingKnowledge } = useAppSelector((state) => state.knowledge);

	const primaryNavItems = buildPrimaryNavItems(projectId);
	const canAddKnowledge =
		Boolean(projectId) &&
		role.trim().toUpperCase() !== ProjectMemberRole.VIEWER.toUpperCase();

	const handleAddClick = useCallback((): void => {
		if (onAddKnowledge) {
			onAddKnowledge();

			return;
		}

		showModal();
	}, [onAddKnowledge, showModal]);

	return (
		<aside className="hidden h-full tablet:flex tablet:w-14 desktop:w-58 flex-shrink-0 flex-col gap-5 border-r border-border bg-surface px-3.5 py-5">
			{projectId && (
				<div className="hidden desktop:flex items-center gap-2.5 p-2 text-accent">
					<Icon name="project" size={PROJECT_ICON_SIZE} />
					<div>
						<div className="text-sm font-medium">{projectName}</div>
						<div className="font-mono text-2xs text-text-faint">
							{role} ROLE
						</div>
					</div>
				</div>
			)}

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
							onClick={handleAddClick}
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

const MobileNav: React.FC = () => {
	const { pathname } = useLocation();
	const projectId = useOptionalCurrentProjectId();
	const mobileNavItems = buildMobileNavItems(projectId);

	return (
		<nav className="flex h-14 w-full shrink-0 items-center justify-around border-t border-border bg-surface tablet:hidden">
			{mobileNavItems.map(({ icon, id, label, to }) => {
				const isActive = Boolean(to) && pathname === to;
				const className = getValidClassNames(
					"flex flex-1 flex-col items-center justify-center py-2 h-full gap-1 text-2xs transition-colors",
					isActive
						? "text-accent font-semibold"
						: "text-text-muted hover:text-text",
				);

				if (to) {
					return (
						<Link
							aria-current={isActive ? "page" : undefined}
							className={className}
							key={id}
							to={to}
						>
							{icon}
							<span>{label}</span>
						</Link>
					);
				}

				return (
					<button className={className} key={id} type="button">
						{icon}
						<span>{label}</span>
					</button>
				);
			})}
		</nav>
	);
};

export { MobileNav, Sidebar };
