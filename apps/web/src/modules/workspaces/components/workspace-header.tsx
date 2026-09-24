import { ProjectMemberRole } from "@knowledgeprism/constants";
import React, { useCallback, useEffect, useRef, useState } from "react";

import { Avatar, Button, Header, Icon, Logo } from "~/components/components.js";
import {
	useAppSelector,
	useLocation,
	useModal,
	useNavigate,
	useOptionalCurrentProjectId,
} from "~/hooks/hooks.js";
import { AppRoute } from "~/lib/enums/enums.js";
import { getValidClassNames } from "~/lib/helpers/helpers.js";
import { AddKnowledgeModal } from "~/modules/knowledge/components/add-knowledge-modal/add-knowledge-modal.js";

interface WorkspaceHeaderProperties {
	avatarUrl?: null | string;
	firstName?: null | string;
	isAdmin?: boolean;
	isLoading?: boolean;
	lastName?: null | string;
	onLogOut?: () => void;
	onOpenSettings?: (() => void) | undefined;
	onOpenUserManagement?: (() => void) | undefined;
	organizationName?: null | string;
}

const ACCOUNT_MENU_ITEM_CLASS =
	"w-full min-h-11 cursor-pointer rounded-md px-3 py-3 text-left text-sm font-medium transition-colors focus:outline-none sm:min-h-0 sm:py-2 sm:text-xs" as const;
const FIRST_CHARACTER_INDEX = 0;
const EMPTY_LENGTH = 0;

const getInitials = (first?: null | string, last?: null | string): string => {
	const safeFirst = first ? first.trim() : "";
	const safeLast = last ? last.trim() : "";

	const firstLetter = safeFirst.charAt(FIRST_CHARACTER_INDEX).toUpperCase();
	const lastLetter = safeLast.charAt(FIRST_CHARACTER_INDEX).toUpperCase();

	const initials = `${firstLetter}${lastLetter}`;

	return initials.length > EMPTY_LENGTH ? initials : "U";
};

const WorkspaceHeader: React.FC<WorkspaceHeaderProperties> = ({
	avatarUrl,
	firstName,
	isAdmin = false,
	isLoading = false,
	lastName,
	onLogOut,
	onOpenSettings,
	onOpenUserManagement,
	organizationName,
}) => {
	const { hideModal, isOpen, showModal } = useModal();
	const { pathname } = useLocation();
	const projectId = useOptionalCurrentProjectId();
	const { isAddingKnowledge } = useAppSelector((state) => state.knowledge);
	const { projects } = useAppSelector(({ workspaces }) => workspaces);
	const currentProject = projects.find((project) => project.id === projectId);
	const [isDropdownOpen, setIsDropdownOpen] = useState(false);

	const WORKSPACE_LIST_PATHS: readonly string[] = [
		AppRoute.ROOT,
		"/workspaces",
		"/workspaces/",
	];

	const isWorkspaceListPage = WORKSPACE_LIST_PATHS.includes(pathname);

	const currentProjectRole = currentProject?.role.trim().toUpperCase();
	const isAllowedRole =
		currentProjectRole === ProjectMemberRole.ADMIN.toUpperCase() ||
		currentProjectRole === ProjectMemberRole.EDITOR.toUpperCase();

	const canShowAddKnowledge =
		Boolean(projectId) && !isWorkspaceListPage && isAllowedRole;

	const dropdownReference = useRef<HTMLDivElement>(null);
	const navigate = useNavigate();

	const fullName = [firstName, lastName].filter(Boolean).join(" ").trim();
	const initials = getInitials(firstName, lastName);
	const trimmedOrgName = organizationName?.trim();

	const handleCloseDropdown = useCallback((): void => {
		setIsDropdownOpen(false);
	}, [setIsDropdownOpen]);

	const handleLogOut = useCallback((): void => {
		setIsDropdownOpen(false);
		onLogOut?.();
	}, [onLogOut, setIsDropdownOpen]);

	const handleOpenSettings = useCallback((): void => {
		setIsDropdownOpen(false);

		if (onOpenSettings) {
			onOpenSettings();

			return;
		}

		void navigate(AppRoute.SETTINGS);
	}, [navigate, onOpenSettings, setIsDropdownOpen]);

	const handleOpenUserManagement = useCallback((): void => {
		setIsDropdownOpen(false);

		if (onOpenUserManagement) {
			onOpenUserManagement();

			return;
		}

		void navigate(AppRoute.USERS);
	}, [navigate, onOpenUserManagement, setIsDropdownOpen]);

	const toggleDropdown = useCallback((): void => {
		setIsDropdownOpen((previous) => !previous);
	}, [setIsDropdownOpen]);

	useEffect(() => {
		const handleClickOutside = (event: MouseEvent): void => {
			if (
				dropdownReference.current &&
				!dropdownReference.current.contains(event.target as Node)
			) {
				setIsDropdownOpen(false);
			}
		};

		document.addEventListener("mousedown", handleClickOutside);

		return () => {
			document.removeEventListener("mousedown", handleClickOutside);
		};
	}, []);

	return (
		<div className="sticky top-0 z-30 w-full bg-surface">
			<Header>
				<div className="flex h-full w-full items-center justify-between">
					<div className="flex shrink-0 items-center gap-3">
						<Logo to={AppRoute.ROOT} />

						{isLoading && (
							<div className="hidden items-center gap-3 sm:flex">
								<span className="text-(length:--text-sm) font-light text-border">
									|
								</span>
								<div className="h-4 w-28 animate-pulse rounded bg-(--color-border-subtle)" />
							</div>
						)}

						{!isLoading && trimmedOrgName && (
							<div className="hidden items-center gap-3 sm:flex">
								<span className="text-(length:--text-sm) font-light text-border">
									|
								</span>
								<span className="max-w-xs truncate text-(length:--text-sm) font-medium text-text">
									{trimmedOrgName}
								</span>
							</div>
						)}
					</div>

					<div className="flex items-center" ref={dropdownReference}>
						{canShowAddKnowledge && (
							<>
								<Button
									aria-label="Add Knowledge"
									className="tablet:hidden ml-2 mr-2 shrink-0 flex items-center gap-1 px-2 py-1 text-2xs font-semibold whitespace-nowrap"
									disabled={isAddingKnowledge}
									onClick={showModal}
									variant="accent"
								>
									<Icon name="plus" size={14} />
									<span className="hidden sm:inline">Add Knowledge</span>
								</Button>

								{isOpen && (
									<AddKnowledgeModal
										isOpen={isOpen}
										onClose={hideModal}
										projectName={currentProject?.name ?? ""}
									/>
								)}
							</>
						)}

						{isLoading && (
							<div className="h-8 w-8 animate-pulse rounded-full bg-(--color-border-subtle) sm:h-8 sm:w-32 sm:rounded-md" />
						)}

						{!isLoading && (
							<div className="relative">
								<button
									className="flex cursor-pointer items-center gap-3 rounded-full border-none outline-none transition-opacity hover:opacity-80 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
									onClick={toggleDropdown}
									type="button"
								>
									{fullName && (
										<span className="hidden max-w-40 truncate text-(length:--text-sm) font-medium text-text-muted sm:inline">
											{fullName}
										</span>
									)}
									<Avatar
										alt={fullName || "User Avatar"}
										initials={initials}
										{...(avatarUrl ? { src: avatarUrl } : {})}
									/>
								</button>

								{isDropdownOpen && (
									<>
										<button
											aria-label="Close menu"
											className="fixed inset-0 z-40 cursor-default border-none bg-black/15 outline-none transition-opacity duration-300 ease-in-out animate-in fade-in lg:hidden"
											onClick={handleCloseDropdown}
											type="button"
										/>

										<div className="fixed inset-x-0 bottom-0 z-50 flex w-full flex-col rounded-t-2xl border-t border-(--color-border-subtle) bg-surface px-3.5 pb-3 pt-2 shadow-2xl transition-all duration-300 ease-out animate-in slide-in-from-bottom sm:absolute sm:bottom-auto sm:left-auto sm:-right-2 sm:top-full sm:mt-2 sm:w-44 sm:rounded-xl sm:border sm:p-2.5 sm:shadow-xl sm:slide-in-from-top-2">
											<div className="mx-auto mb-2 h-1 w-8 rounded-full bg-border sm:hidden" />

											<div className="mb-2 flex items-center gap-2.5 border-b border-(--color-border-subtle) pb-2 sm:hidden">
												<Avatar
													alt={fullName || "User Avatar"}
													initials={initials}
													{...(avatarUrl ? { src: avatarUrl } : {})}
												/>
												<div className="flex min-w-0 flex-col">
													<span className="truncate text-xs font-semibold text-text">
														{fullName}
													</span>
													{trimmedOrgName && (
														<span className="truncate text-2xs text-text-muted">
															{trimmedOrgName}
														</span>
													)}
												</div>
											</div>

											<div className="flex flex-col gap-0.5 sm:gap-1.5">
												<button
													className={getValidClassNames(
														ACCOUNT_MENU_ITEM_CLASS,
														"text-text-muted hover:bg-secondary hover:text-text",
													)}
													onClick={handleOpenSettings}
													type="button"
												>
													Settings
												</button>

												{isAdmin && (
													<button
														className="w-full cursor-pointer rounded-md px-3 py-2 text-left text-xs font-medium text-text-muted transition-colors hover:bg-secondary hover:text-text focus:outline-none sm:py-2"
														onClick={handleOpenUserManagement}
														type="button"
													>
														User Management
													</button>
												)}

												<button
													className={getValidClassNames(
														ACCOUNT_MENU_ITEM_CLASS,
														"text-error hover:bg-error-bg hover:text-error-hover",
													)}
													onClick={handleLogOut}
													type="button"
												>
													Log out
												</button>
											</div>
										</div>
									</>
								)}
							</div>
						)}
					</div>
				</div>
			</Header>
		</div>
	);
};

export { WorkspaceHeader };
