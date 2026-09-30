import { ProjectMemberRole } from "@knowledgeprism/constants";
import { useFocusReturn, useFocusTrap, useMergedRef } from "@mantine/hooks";
import React, { useCallback, useEffect, useRef } from "react";
import { generatePath, Link } from "react-router-dom";

import { Icon } from "~/components/icon/icon.js";
import {
	useAppSelector,
	useCanWriteKnowledge,
	useLocation,
	useModal,
	useOptionalCurrentProjectId,
} from "~/hooks/hooks.js";
import { AppRoute } from "~/lib/enums/enums.js";
import { getValidClassNames } from "~/lib/helpers/helpers.js";
import { AddKnowledgeModal } from "~/modules/knowledge/components/add-knowledge-modal/add-knowledge-modal.js";
import { getUserManagementCopy } from "~/modules/users/libs/constants/user-management-copy.constant.js";
import {
	buildUserManagementPath,
	resolveSelectedProjectId,
} from "~/modules/users/libs/helpers/user-management-project.helper.js";

import {
	MOBILE_NAV_ICON_SIZE,
	SIDEBAR_FOCUS_DELAY_MS,
} from "./libs/constants.js";
import { type ShellSidebar } from "./libs/use-shell-sidebar.hook.js";
import { type NavItem } from "./sidebar-nav-item.js";
import { SidebarPanel } from "./sidebar-panel.js";

type SidebarProperties = {
	isAdmin?: boolean;
	onAddKnowledge?: () => void;
	projectName: string;
	role: string;
	shell: ShellSidebar;
};

const buildProjectLink = (
	projectId: string | undefined,
	route: string,
): string | undefined => {
	return projectId ? generatePath(route, { projectId }) : undefined;
};

const buildPrimaryNavItems = (projectId: string | undefined): NavItem[] => {
	return [
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
};

const buildUtilityNavItems = (
	role: string,
	isAdmin: boolean | undefined,
	projectId: string | undefined,
): NavItem[] => {
	if (!projectId || (!isAdmin && role !== ProjectMemberRole.ADMIN)) {
		return [];
	}

	return [
		{
			icon: <Icon name="users" />,
			id: "users",
			label: getUserManagementCopy(true).NAV_LABEL,
			to: buildUserManagementPath(projectId),
		},
	];
};

const buildMobileNavItems = (projectId: string | undefined): NavItem[] => {
	return [
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
};

const Sidebar: React.FC<SidebarProperties> = ({
	isAdmin,
	onAddKnowledge,
	projectName,
	role,
	shell,
}: SidebarProperties) => {
	const routeProjectId = useOptionalCurrentProjectId();
	const { pathname, search } = useLocation();
	const projectId =
		resolveSelectedProjectId({
			fallbackProjectId: routeProjectId ?? null,
			pathname,
			search,
		}) ?? undefined;
	const { hideModal, isOpen, showModal } = useModal();
	const { isAddingKnowledge } = useAppSelector((state) => state.knowledge);
	const canAddKnowledge = useCanWriteKnowledge();
	const sidebarReference = useRef<HTMLElement>(null);
	const focusTrapReference = useFocusTrap(shell.isOverlayOpen);
	const mergedReference = useMergedRef(sidebarReference, focusTrapReference);
	const { dismissOverlay, isExpanded, isOverlayOpen, toggleSidebar } = shell;

	useFocusReturn({ opened: isOverlayOpen });

	const primaryNavItems = buildPrimaryNavItems(projectId);
	const utilityNavItems = buildUtilityNavItems(role, isAdmin, projectId);

	const handleAddClick = useCallback((): void => {
		if (onAddKnowledge) {
			onAddKnowledge();

			return;
		}

		showModal();
	}, [onAddKnowledge, showModal]);

	useEffect(() => {
		if (!isOverlayOpen) {
			return;
		}

		const timeoutId = setTimeout(() => {
			sidebarReference.current?.focus();
		}, SIDEBAR_FOCUS_DELAY_MS);

		const handleKeyDown = (event: KeyboardEvent): void => {
			if (event.key === "Escape") {
				dismissOverlay();
			}
		};

		document.addEventListener("keydown", handleKeyDown);

		return (): void => {
			clearTimeout(timeoutId);
			document.removeEventListener("keydown", handleKeyDown);
		};
	}, [dismissOverlay, isOverlayOpen]);

	return (
		<div
			className={
				isOverlayOpen
					? "absolute inset-y-0 left-0 z-50 h-full"
					: "relative z-20 h-full shrink-0"
			}
		>
			<SidebarPanel
				asideRef={mergedReference}
				canAddKnowledge={canAddKnowledge}
				isAddingKnowledge={isAddingKnowledge}
				isExpanded={isExpanded}
				onAddKnowledgeClick={handleAddClick}
				onToggle={toggleSidebar}
				primaryNavItems={primaryNavItems}
				projectId={projectId}
				projectName={projectName}
				role={role}
				utilityNavItems={utilityNavItems}
			/>
			{canAddKnowledge && (
				<AddKnowledgeModal
					isOpen={isOpen}
					onClose={hideModal}
					projectName={projectName}
				/>
			)}
		</div>
	);
};

const MobileNav: React.FC = () => {
	const { pathname } = useLocation();
	const projectId = useOptionalCurrentProjectId();
	const mobileNavItems = buildMobileNavItems(projectId);

	return (
		<nav className="flex h-14 w-full shrink-0 items-center justify-around border-t border-border bg-surface">
			{mobileNavItems.map(({ icon, id, label, to }) => {
				const isActive = Boolean(to) && pathname === to;
				const className = getValidClassNames(
					"flex h-full flex-1 flex-col items-center justify-center gap-1 py-2 text-2xs transition-colors",
					isActive
						? "font-semibold text-accent"
						: "text-text-muted hover:text-text",
					!to && "cursor-not-allowed opacity-40",
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
					<button className={className} disabled key={id} type="button">
						{icon}
						<span>{label}</span>
					</button>
				);
			})}
		</nav>
	);
};

export { MobileNav, Sidebar };
