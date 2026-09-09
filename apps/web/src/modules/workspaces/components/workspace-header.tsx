import React, { useCallback } from "react";

import { Logo } from "~/components/components.js";
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

const WorkspaceHeader: React.FC<WorkspaceHeaderProperties> = ({
	firstName,
	isLoading = false,
	lastName,
	onLogOut,
	onOpenSettings,
	organizationName,
}) => {
	const navigate = useNavigate();
	const fullName = [firstName, lastName].filter(Boolean).join(" ").trim();

	const handleLogOut = useCallback((): void => {
		onLogOut?.();
	}, [onLogOut]);

	const handleOpenSettings = useCallback((): void => {
		if (onOpenSettings) {
			onOpenSettings();

			return;
		}

		void navigate(AppRoute.SETTINGS);
	}, [navigate, onOpenSettings]);

	const trimmedOrgName = organizationName?.trim();

	return (
		<header className="flex w-full items-center justify-between border-b border-(--color-border-subtle) bg-(--color-surface) px-4 py-3 sm:px-6 md:px-8 md:py-4">
			<div className="flex min-w-0 items-center gap-3">
				<Logo to={AppRoute.ROOT} />
				{isLoading ? (
					<div className="flex items-center gap-3">
						<span className="text-(length:--text-sm) font-light text-border">
							|
						</span>
						<div className="h-4 w-28 animate-pulse rounded bg-(--color-border-subtle)" />
					</div>
				) : (
					trimmedOrgName && (
						<div className="flex items-center gap-3">
							<span className="text-(length:--text-sm) font-light text-border">
								|
							</span>
							<span className="max-w-xs truncate text-(length:--text-sm) font-medium text-text">
								{trimmedOrgName}
							</span>
						</div>
					)
				)}
			</div>

			<div className="flex items-center gap-4 sm:gap-6">
				{isLoading ? (
					<div className="h-4 w-32 animate-pulse rounded bg-(--color-border-subtle)" />
				) : (
					fullName && (
						<span className="max-w-40 truncate text-(length:--text-sm) font-medium text-text-muted">
							{fullName}
						</span>
					)
				)}

				<button
					className="flex cursor-pointer items-center gap-1.5 text-(length:--text-sm) font-normal text-text-muted transition-colors hover:text-text"
					onClick={handleOpenSettings}
					type="button"
				>
					<svg
						className="h-4 w-4 stroke-current"
						fill="none"
						viewBox="0 0 24 24"
					>
						<path
							d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
							strokeLinecap="round"
							strokeLinejoin="round"
							strokeWidth="1.5"
						/>
						<path
							d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
							strokeLinecap="round"
							strokeLinejoin="round"
							strokeWidth="1.5"
						/>
					</svg>
					<span>Settings</span>
				</button>

				<button
					className="flex cursor-pointer items-center gap-1.5 text-(length:--text-sm) font-normal text-text-muted transition-colors hover:text-text"
					onClick={handleLogOut}
					type="button"
				>
					<svg
						className="h-4 w-4 stroke-current"
						fill="none"
						viewBox="0 0 24 24"
					>
						<path
							d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l3 3m0 0l-3 3m3-3H2.25"
							strokeLinecap="round"
							strokeLinejoin="round"
							strokeWidth="1.5"
						/>
					</svg>
					<span>Log out</span>
				</button>
			</div>
		</header>
	);
};

export { WorkspaceHeader };
