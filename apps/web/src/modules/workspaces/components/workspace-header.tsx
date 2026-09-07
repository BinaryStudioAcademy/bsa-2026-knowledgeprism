import React, { useCallback, useEffect, useRef, useState } from "react";

import { Avatar, Logo } from "~/components/components.js";
import { AppRoute } from "~/lib/enums/enums.js";

interface WorkspaceHeaderProperties {
	avatarUrl?: null | string;
	firstName?: null | string;
	isOrgAdmin?: boolean;
	lastName?: null | string;
	onLogOut?: () => void;
	onOpenNotifications?: () => void;
	onOpenSettings?: () => void;
	organizationName?: null | string;
}

const APP_BRAND_NAME = "KnowledgePrism";

const DEFAULT_AVATAR =
	"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%23A8A299'><path d='M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 4c1.93 0 3.5 1.57 3.5 3.5S13.93 13 12 13s-3.5-1.57-3.5-3.5S10.07 6 12 6zm0 14c-2.03 0-3.8-1.04-4.84-2.6.03-1.61 3.22-2.5 4.84-2.5 1.61 0 4.81.89 4.84 2.5-1.04 1.56-2.81 2.6-4.84 2.6z'/></svg>";

const WorkspaceHeader: React.FC<WorkspaceHeaderProperties> = ({
	avatarUrl,
	firstName,
	lastName,
	onLogOut,
	onOpenSettings,
	organizationName,
}) => {
	const [isDark, setIsDark] = useState<boolean>(() => {
		return document.documentElement.classList.contains("dark");
	});

	const [isUserMenuOpen, setIsUserMenuOpen] = useState<boolean>(false);
	const menuReference = useRef<HTMLDivElement>(null);

	const safeFirstName = firstName ?? "";
	const safeLastName = lastName ?? "";
	const fullName = `${safeFirstName} ${safeLastName}`.trim();

	const trimmedOrgName = organizationName?.trim();
	const shouldShowOrgName =
		Boolean(trimmedOrgName) &&
		trimmedOrgName?.toLowerCase() !== APP_BRAND_NAME.toLowerCase();

	const handleToggleTheme = useCallback((): void => {
		setIsDark((previous) => {
			const isNextState = !previous;
			document.documentElement.classList.toggle("dark", isNextState);
			return isNextState;
		});
	}, []);

	const handleToggleUserMenu = useCallback((): void => {
		setIsUserMenuOpen((previous) => !previous);
	}, []);

	const handleOpenSettings = useCallback((): void => {
		setIsUserMenuOpen(false);
		onOpenSettings?.();
	}, [onOpenSettings]);

	const handleLogOut = useCallback((): void => {
		setIsUserMenuOpen(false);
		onLogOut?.();
	}, [onLogOut]);

	useEffect(() => {
		const handleClickOutside = (event: MouseEvent): void => {
			if (
				menuReference.current &&
				!menuReference.current.contains(event.target as Node)
			) {
				setIsUserMenuOpen(false);
			}
		};

		const handleKeyDown = (event: KeyboardEvent): void => {
			if (event.key === "Escape") {
				setIsUserMenuOpen(false);
			}
		};

		document.addEventListener("mousedown", handleClickOutside);
		document.addEventListener("keydown", handleKeyDown);

		return () => {
			document.removeEventListener("mousedown", handleClickOutside);
			document.removeEventListener("keydown", handleKeyDown);
		};
	}, []);

	return (
		<header className="flex w-full items-center justify-between border-b border-[#EBE8E1] bg-white px-4 py-3 sm:px-6 md:px-8 md:py-4">
			<div className="flex items-center gap-3 min-w-0">
				<Logo to={AppRoute.ROOT} />
				{shouldShowOrgName && (
					<span className="hidden md:inline-block border-l border-[#EBE8E1] pl-3 text-sm font-medium text-[#1C1A17] truncate max-w-xs">
						{trimmedOrgName}
					</span>
				)}
			</div>

			<div className="flex items-center gap-2.5 sm:gap-3">
				<button
					aria-label="Toggle theme"
					className="cursor-pointer p-1.5 sm:p-2 rounded-lg border border-[#EBE8E1] text-[#706E6B] hover:bg-[#F2F0EC] hover:text-[#1C1A17] transition-colors"
					onClick={handleToggleTheme}
					type="button"
				>
					<svg
						className={`h-4 w-4 sm:h-5 sm:w-5 ${isDark ? "text-amber-500" : ""}`}
						fill="none"
						stroke="currentColor"
						viewBox="0 0 24 24"
					>
						<path
							d="M12 3v2.25m0 13.5V21m8.966-8.966h-2.25m-13.5 0H3m15.364 6.364l-1.591-1.591M6.758 6.758L5.167 5.167m12.728 0l-1.591 1.591M6.758 17.242l-1.591 1.591M12 18a6 6 0 100-12 6 6 0 000 12z"
							strokeLinecap="round"
							strokeLinejoin="round"
							strokeWidth="1.5"
						/>
					</svg>
				</button>

				<div className="relative" ref={menuReference}>
					<button
						aria-expanded={isUserMenuOpen}
						aria-haspopup="true"
						aria-label="User Profile"
						className="flex items-center gap-2 cursor-pointer rounded-full transition-opacity hover:opacity-80 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#1C1A17]"
						onClick={handleToggleUserMenu}
						type="button"
					>
						<Avatar
							alt={fullName || "User Avatar"}
							src={avatarUrl || DEFAULT_AVATAR}
						/>
						{fullName && (
							<span className="hidden sm:inline-block text-sm font-medium text-[#1C1A17] max-w-28 truncate">
								{fullName}
							</span>
						)}
					</button>

					{isUserMenuOpen && (
						<div className="absolute right-0 mt-2 w-52 rounded-2xl border border-[#EBE8E1] bg-white p-3 shadow-xl z-50">
							<div className="px-2 py-1">
								{fullName && (
									<p className="text-sm font-semibold text-[#1C1A17] truncate">
										{fullName}
									</p>
								)}
								{trimmedOrgName && (
									<p className="text-xs text-[#706E6B] truncate">
										{trimmedOrgName}
									</p>
								)}
							</div>

							<hr className="my-2 border-[#EBE8E1]" />

							<button
								className="w-full text-left px-2 py-1.5 text-sm font-medium text-[#1C1A17] hover:bg-[#F2F0EC] rounded-lg transition-colors cursor-pointer"
								onClick={handleOpenSettings}
								type="button"
							>
								Settings
							</button>

							<button
								className="w-full text-left px-2 py-1.5 text-sm font-medium text-[#C4433A] hover:bg-[#F2F0EC] rounded-lg transition-colors cursor-pointer"
								onClick={handleLogOut}
								type="button"
							>
								Log Out
							</button>
						</div>
					)}
				</div>
			</div>
		</header>
	);
};

export { WorkspaceHeader };
