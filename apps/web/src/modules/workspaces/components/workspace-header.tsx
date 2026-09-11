import React, { useCallback, useEffect, useRef, useState } from "react";

import { Avatar, Header, Icon, Logo } from "~/components/components.js";
import { useNavigate } from "~/hooks/hooks.js";
import { AppRoute } from "~/lib/enums/enums.js";

interface WorkspaceHeaderProperties {
	avatarUrl?: null | string;
	firstName?: null | string;
	isLoading?: boolean;
	lastName?: null | string;
	onLogOut?: () => void;
	onOpenSettings?: (() => void) | undefined;
	organizationName?: null | string;
}

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
	isLoading = false,
	lastName,
	onLogOut,
	onOpenSettings,
	organizationName,
}) => {
	const [isDropdownOpen, setIsDropdownOpen] = useState(false);

	const dropdownReference = useRef<HTMLDivElement>(null);
	const navigate = useNavigate();

	const fullName = [firstName, lastName].filter(Boolean).join(" ").trim();
	const initials = getInitials(firstName, lastName);
	const trimmedOrgName = organizationName?.trim();

	const handleLogOut = useCallback((): void => {
		setIsDropdownOpen(false);
		onLogOut?.();
	}, [onLogOut]);

	const handleOpenSettings = useCallback((): void => {
		setIsDropdownOpen(false);

		if (onOpenSettings) {
			onOpenSettings();

			return;
		}

		void navigate(AppRoute.SETTINGS);
	}, [navigate, onOpenSettings]);

	const toggleDropdown = useCallback((): void => {
		setIsDropdownOpen((previous) => !previous);
	}, []);

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
		<Header>
			<div className="flex h-full w-full items-center justify-between">
				<div className="flex min-w-0 items-center gap-3">
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

				<div className="hidden items-center gap-4 sm:flex">
					{isLoading && (
						<div className="h-4 w-32 animate-pulse rounded bg-(--color-border-subtle)" />
					)}
					{!isLoading && (
						<>
							<div className="flex items-center gap-3">
								<Avatar
									alt={fullName || "User Avatar"}
									initials={initials}
									{...(avatarUrl ? { src: avatarUrl } : {})}
								/>
								{fullName && (
									<span className="max-w-40 truncate text-(length:--text-sm) font-medium text-text-muted">
										{fullName}
									</span>
								)}
							</div>

							<div className="mx-1 h-5 w-px bg-(--color-border-subtle)" />

							<div className="flex items-center gap-2">
								<button
									aria-label="Settings"
									className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full text-text-muted transition-colors hover:bg-surface-hover hover:text-text"
									onClick={handleOpenSettings}
									type="button"
								>
									<Icon name="settings" size={18} />
								</button>

								<button
									aria-label="Log out"
									className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full text-text-muted transition-colors hover:bg-surface-hover hover:text-text"
									onClick={handleLogOut}
									type="button"
								>
									<Icon name="close" size={18} />
								</button>
							</div>
						</>
					)}
				</div>

				<div
					className="relative flex items-center sm:hidden"
					ref={dropdownReference}
				>
					<button
						className="flex cursor-pointer items-center justify-center rounded-full transition-opacity hover:opacity-80"
						onClick={toggleDropdown}
						type="button"
					>
						<Avatar
							alt={fullName || "User Avatar"}
							initials={initials}
							{...(avatarUrl ? { src: avatarUrl } : {})}
						/>
					</button>

					{isDropdownOpen && (
						<div className="absolute right-0 top-full z-50 mt-3 flex w-64 flex-col rounded-lg border border-(--color-border-subtle) bg-(--color-surface) p-4 shadow-lg">
							{trimmedOrgName && (
								<div className="mb-3 flex flex-col border-b border-(--color-border-subtle) pb-3">
									<span className="text-(length:--text-xs) text-text-muted">
										Workspace
									</span>
									<span className="truncate text-(length:--text-sm) font-medium text-text">
										{trimmedOrgName}
									</span>
								</div>
							)}

							<div className="mb-3 flex items-center gap-3 border-b border-(--color-border-subtle) pb-3">
								<Avatar
									alt={fullName || "User Avatar"}
									initials={initials}
									{...(avatarUrl ? { src: avatarUrl } : {})}
								/>
								<span className="truncate text-(length:--text-sm) font-medium text-text">
									{fullName}
								</span>
							</div>

							<div className="flex flex-col gap-2">
								<button
									className="flex w-full cursor-pointer items-center gap-2 rounded-md p-2 text-left text-(length:--text-sm) text-text-muted transition-colors hover:bg-secondary hover:text-text"
									onClick={handleOpenSettings}
									type="button"
								>
									<Icon name="settings" size={16} />
									<span>Settings</span>
								</button>

								<button
									className="flex w-full cursor-pointer items-center gap-2 rounded-md p-2 text-left text-(length:--text-sm) text-red-500 transition-colors hover:bg-red-50 hover:text-red-600"
									onClick={handleLogOut}
									type="button"
								>
									<Icon name="close" size={16} />
									<span>Log out</span>
								</button>
							</div>
						</div>
					)}
				</div>
			</div>
		</Header>
	);
};

export { WorkspaceHeader };
