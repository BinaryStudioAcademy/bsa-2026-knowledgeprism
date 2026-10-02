import { ProjectMemberRole } from "@knowledgeprism/constants";
import { useFocusReturn, useFocusTrap, useMergedRef } from "@mantine/hooks";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { generatePath, Link, useNavigate } from "react-router-dom";

import { useKnowledgeTreePanel } from "~/app/layouts/knowledge-tree-panel-context.js";
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

const buildPrimaryNavItems = (
	projectId: string | undefined,
	openKnowledgeTree: () => void,
): NavItem[] => {
	return [
		{
			icon: <Icon name="knowledge-tree" />,
			id: "knowledge-tree",
			label: "Knowledge Tree",
			onNavigate: openKnowledgeTree,
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

const buildMobileNavItems = (
	projectId: string | undefined,
	openKnowledgeTree: () => void,
): NavItem[] => {
	return [
		{
			icon: <Icon name="knowledge-tree" size={MOBILE_NAV_ICON_SIZE} />,
			id: "knowledge-tree",
			label: "Tree",
			onNavigate: openKnowledgeTree,
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
	const { openKnowledgeTree } = useKnowledgeTreePanel();
	const { hideModal, isOpen, showModal } = useModal();
	const { isAddingKnowledge } = useAppSelector((state) => state.knowledge);
	const canAddKnowledge = useCanWriteKnowledge();
	const sidebarReference = useRef<HTMLElement>(null);
	const focusTrapReference = useFocusTrap(shell.isOverlayOpen);
	const mergedReference = useMergedRef(sidebarReference, focusTrapReference);
	const { dismissOverlay, isExpanded, isOverlayOpen, toggleSidebar } = shell;

	useFocusReturn({ opened: isOverlayOpen });

	const primaryNavItems = buildPrimaryNavItems(projectId, openKnowledgeTree);
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

type MobileNavProperties = {
	isAdmin?: boolean;
	projectName?: string;
	role?: string;
};

const MobileNav: React.FC<MobileNavProperties> = ({
	isAdmin,
	projectName,
	role,
}) => {
	const { pathname } = useLocation();
	const navigate = useNavigate();
	const projectId = useOptionalCurrentProjectId();
	const { openKnowledgeTree } = useKnowledgeTreePanel();
	const mobileNavItems = buildMobileNavItems(projectId, openKnowledgeTree);
	const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false);
	const canAddKnowledge = useCanWriteKnowledge();
	const { hideModal, isOpen, showModal } = useModal();

	const handleCloseMoreMenu = useCallback((): void => {
		setIsMoreMenuOpen(false);
	}, [setIsMoreMenuOpen]);

	const handleOpenMoreMenu = useCallback((): void => {
		setIsMoreMenuOpen(true);
	}, [setIsMoreMenuOpen]);

	const handleOpenUserManagement = useCallback((): void => {
		setIsMoreMenuOpen(false);
		if (projectId) {
			void navigate(buildUserManagementPath(projectId));
		}
	}, [navigate, projectId, setIsMoreMenuOpen]);

	const handleBackToProjects = useCallback((): void => {
		setIsMoreMenuOpen(false);
		void navigate(AppRoute.WORKSPACES);
	}, [navigate, setIsMoreMenuOpen]);

	const handleAddKnowledge = useCallback((): void => {
		setIsMoreMenuOpen(false);
		showModal();
	}, [setIsMoreMenuOpen, showModal]);

	return (
		<>
			<nav className="flex h-14 w-full shrink-0 items-center justify-around border-t border-border bg-surface">
				{mobileNavItems.map(({ icon, id, label, onNavigate, to }) => {
					const isActive = Boolean(to) && pathname === to;
					const className = getValidClassNames(
						"flex h-full flex-1 flex-col items-center justify-center gap-1 py-2 text-2xs transition-colors no-underline hover:no-underline focus:no-underline",
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
								onClick={onNavigate}
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
				<button
					className="flex h-full flex-1 flex-col items-center justify-center gap-1 py-2 text-2xs text-text-muted transition-colors hover:text-text"
					onClick={handleOpenMoreMenu}
					type="button"
				>
					<Icon name="more" size={MOBILE_NAV_ICON_SIZE} />
					<span>More</span>
				</button>
			</nav>

			<>
				<button
					aria-label="Close menu"
					className={getValidClassNames(
						"fixed inset-0 z-40 cursor-default border-none bg-black/15 outline-none transition-opacity duration-300 ease-in-out lg:hidden",
						isMoreMenuOpen ? "opacity-100" : "pointer-events-none opacity-0",
					)}
					onClick={handleCloseMoreMenu}
					type="button"
				/>
				<div
					className={getValidClassNames(
						"fixed inset-x-0 bottom-0 z-50 flex w-full flex-col rounded-t-2xl border-t border-(--color-border-subtle) bg-surface px-3.5 pb-5 pt-2 shadow-2xl transition-transform duration-300 ease-out",
						isMoreMenuOpen ? "translate-y-0" : "translate-y-full",
					)}
					inert={isMoreMenuOpen ? undefined : ""}
				>
					<div className="mx-auto mb-2 h-1 w-8 rounded-full bg-border" />

					{projectName && role && (
						<div className="mb-2 flex items-center gap-2.5 border-b border-(--color-border-subtle) pb-3 pt-1">
							<div className="flex h-8 w-8 items-center justify-center rounded-md bg-accent/10 text-accent">
								<Icon name="project" size={16} />
							</div>
							<div className="flex min-w-0 flex-col">
								<span className="truncate text-sm font-semibold text-text">
									{projectName}
								</span>
								<span className="font-mono text-2xs text-text-muted">
									{role} ROLE
								</span>
							</div>
						</div>
					)}

					<div className="flex flex-col gap-1.5 pt-1">
						{canAddKnowledge && (
							<button
								className="flex w-full items-center gap-3 rounded-md px-3 py-3 text-left text-sm font-medium text-text transition-colors hover:bg-secondary focus:outline-none"
								onClick={handleAddKnowledge}
								type="button"
							>
								<Icon name="plus" size={16} />
								<span>Add Knowledge</span>
							</button>
						)}

						{isAdmin && (
							<button
								className="flex w-full items-center gap-3 rounded-md px-3 py-3 text-left text-sm font-medium text-text transition-colors hover:bg-secondary focus:outline-none"
								onClick={handleOpenUserManagement}
								type="button"
							>
								<Icon name="users" size={16} />
								<span>Project Members</span>
							</button>
						)}

						<button
							className="flex w-full items-center gap-3 rounded-md px-3 py-3 text-left text-sm font-medium text-text transition-colors hover:bg-secondary focus:outline-none"
							onClick={handleBackToProjects}
							type="button"
						>
							<span className="inline-flex rotate-180">
								<Icon name="chevron-filled-right" size={16} />
							</span>
							<span>Back to Projects</span>
						</button>
					</div>
				</div>
			</>

			{isOpen && canAddKnowledge && projectName && (
				<AddKnowledgeModal
					isOpen={isOpen}
					onClose={hideModal}
					projectName={projectName}
				/>
			)}
		</>
	);
};

export { MobileNav, Sidebar };
