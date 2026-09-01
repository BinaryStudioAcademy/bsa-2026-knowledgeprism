import { Link as RouterLink, useNavigate } from "react-router-dom";

import { Button } from "~/components/button/button.js";
import { Logo } from "~/components/logo/logo.js";
import { useCallback, useEffect, useState } from "~/hooks/hooks.js";
import { AppRoute, Breakpoint } from "~/lib/enums/enums.js";

const HEADER_LABEL = {
	MENU: "Menu",
	SIGN_IN: "Sign in",
	SIGN_UP: "Sign up",
} as const;

const HEADER_MENU_ICON_HEIGHT = 14;
const HEADER_MENU_ICON_STROKE_WIDTH = 1.6;
const HEADER_MENU_ICON_WIDTH = 20;

const HEADER_NAV_ID = "header-nav";

const HEADER_SECTION_LINKS = [
	{ href: "#what", label: "Product" },
	{ href: "#how", label: "How it works" },
	{ href: "#features", label: "Features" },
] as const;

const Header: React.FC = () => {
	const navigate = useNavigate();
	const [isMenuOpen, setIsMenuOpen] = useState(false);

	const handleToggleMenu = useCallback((): void => {
		setIsMenuOpen((isOpen) => !isOpen);
	}, []);

	const handleCloseMenu = useCallback((): void => {
		setIsMenuOpen(false);
	}, []);

	const handleSignIn = useCallback((): void => {
		handleCloseMenu();
		void navigate(AppRoute.SIGN_IN);
	}, [handleCloseMenu, navigate]);

	const handleSignUp = useCallback((): void => {
		handleCloseMenu();
		void navigate(AppRoute.SIGN_UP);
	}, [handleCloseMenu, navigate]);

	useEffect(() => {
		const mediaQuery = matchMedia(
			`(min-width: ${String(Breakpoint.TABLET_SMALL)}px)`,
		);

		const handleViewportChange = (event: MediaQueryListEvent): void => {
			if (event.matches) {
				setIsMenuOpen(false);
			}
		};

		mediaQuery.addEventListener("change", handleViewportChange);

		return (): void => {
			mediaQuery.removeEventListener("change", handleViewportChange);
		};
	}, []);

	return (
		<header className="sticky top-0 z-30 border-b border-border bg-bg/92 backdrop-blur-[6px]">
			<div className="mx-auto flex h-[72px] max-w-[1240px] items-center justify-between px-[clamp(20px,5vw,40px)]">
				<RouterLink
					className="text-text no-underline hover:text-text hover:no-underline"
					to={AppRoute.ROOT}
				>
					<Logo />
				</RouterLink>

				<nav className="hidden items-center gap-8 tablet-small:flex">
					{HEADER_SECTION_LINKS.map((item) => (
						<a
							className="text-control text-text-muted no-underline hover:text-text hover:no-underline"
							href={item.href}
							key={item.href}
						>
							{item.label}
						</a>
					))}
					<div className="flex items-center gap-2.5">
						<Button
							className="px-3.5 py-[9px]"
							onClick={handleSignIn}
							variant="ghost"
						>
							{HEADER_LABEL.SIGN_IN}
						</Button>
						<Button
							className="px-[18px] py-[9px]"
							onClick={handleSignUp}
							variant="primary"
						>
							{HEADER_LABEL.SIGN_UP}
						</Button>
					</div>
				</nav>

				<button
					aria-controls={HEADER_NAV_ID}
					aria-expanded={isMenuOpen}
					aria-label={HEADER_LABEL.MENU}
					className="cursor-pointer border-0 bg-transparent p-2 text-text tablet-small:hidden"
					onClick={handleToggleMenu}
					type="button"
				>
					<svg
						aria-hidden="true"
						fill="none"
						height={HEADER_MENU_ICON_HEIGHT}
						viewBox="0 0 20 14"
						width={HEADER_MENU_ICON_WIDTH}
					>
						<path
							d="M0 1h20M0 7h20M0 13h20"
							stroke="currentColor"
							strokeWidth={HEADER_MENU_ICON_STROKE_WIDTH}
						/>
					</svg>
				</button>
			</div>

			{isMenuOpen && (
				<nav
					className="flex flex-col gap-3.5 border-t border-border bg-bg px-[clamp(20px,5vw,40px)] pb-6 pt-4 tablet-small:hidden"
					id={HEADER_NAV_ID}
				>
					{HEADER_SECTION_LINKS.map((item) => (
						<a
							className="text-body text-text no-underline hover:text-text hover:no-underline"
							href={item.href}
							key={item.href}
							onClick={handleCloseMenu}
						>
							{item.label}
						</a>
					))}
					<div className="mt-1.5 flex gap-2.5">
						<Button
							className="flex-1 border border-border py-2.5"
							onClick={handleSignIn}
							variant="ghost"
						>
							{HEADER_LABEL.SIGN_IN}
						</Button>
						<Button
							className="flex-1 py-2.5"
							onClick={handleSignUp}
							variant="primary"
						>
							{HEADER_LABEL.SIGN_UP}
						</Button>
					</div>
				</nav>
			)}
		</header>
	);
};

export { Header };
