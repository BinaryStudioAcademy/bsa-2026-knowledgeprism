import { Link as RouterLink, useNavigate } from "react-router-dom";
import { tv } from "tailwind-variants";

import { Button } from "~/components/button/button.js";
import { Logo } from "~/components/logo/logo.js";
import { useCallback, useEffect, useState } from "~/hooks/hooks.js";
import { AppRoute, Breakpoint } from "~/lib/enums/enums.js";

const HEADER_LABEL = {
	MENU: "Menu",
	SIGN_IN: "Sign in",
	SIGN_UP: "Sign up",
} as const;

const HEADER_MENU_ICON_HEIGHT = 12;
const HEADER_MENU_ICON_STROKE_WIDTH = 1.4;
const HEADER_MENU_ICON_WIDTH = 18;

const HEADER_NAV_ID = "header-nav";

const getHeaderClassName = tv({
	slots: {
		bar: "mx-auto flex min-h-[72px] w-full max-w-[1240px] items-center justify-between px-5 tablet-small:px-6 tablet:px-10",
		brand: "text-text no-underline hover:text-text hover:no-underline",
		desktopNav: "hidden items-center gap-8 tablet-small:flex",
		mobileNav:
			"flex flex-col gap-3.5 border-t border-border bg-bg px-5 py-4 tablet-small:hidden",
		root: "sticky top-0 z-30 shrink-0 border-b border-border bg-bg/92 backdrop-blur-[6px]",
		signIn:
			"rounded-md px-3.5 py-2 text-control font-medium text-text no-underline hover:bg-secondary hover:text-text hover:no-underline",
		toggle:
			"cursor-pointer border-0 bg-transparent p-2 text-text tablet-small:hidden focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-accent/35",
	},
});

type Properties = {
	children?: React.ReactNode;
};

const Header: React.FC<Properties> = () => {
	const navigate = useNavigate();
	const [isMenuOpen, setIsMenuOpen] = useState(false);
	const {
		bar,
		brand,
		desktopNav,
		mobileNav,
		root,
		signIn,
		toggle,
	} = getHeaderClassName();

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
		<header className={root()}>
			<div className={bar()}>
				<RouterLink className={brand()} to={AppRoute.ROOT}>
					<Logo size="sm" />
				</RouterLink>

				<nav className={desktopNav()}>
					<RouterLink className={signIn()} to={AppRoute.SIGN_IN}>
						{HEADER_LABEL.SIGN_IN}
					</RouterLink>
					<Button
						className="px-4 py-2"
						onClick={handleSignUp}
						variant="primary"
					>
						{HEADER_LABEL.SIGN_UP}
					</Button>
				</nav>

				<button
					aria-controls={HEADER_NAV_ID}
					aria-expanded={isMenuOpen}
					aria-label={HEADER_LABEL.MENU}
					className={toggle()}
					onClick={handleToggleMenu}
					type="button"
				>
					<svg
						aria-hidden="true"
						fill="none"
						height={HEADER_MENU_ICON_HEIGHT}
						viewBox="0 0 18 12"
						width={HEADER_MENU_ICON_WIDTH}
					>
						<path
							d="M0 1h18M0 6h18M0 11h18"
							stroke="currentColor"
							strokeWidth={HEADER_MENU_ICON_STROKE_WIDTH}
						/>
					</svg>
				</button>
			</div>

			{isMenuOpen && (
				<nav className={mobileNav()} id={HEADER_NAV_ID}>
					<Button className="w-full" onClick={handleSignIn} variant="ghost">
						{HEADER_LABEL.SIGN_IN}
					</Button>
					<Button
						className="w-full"
						onClick={handleSignUp}
						variant="primary"
					>
						{HEADER_LABEL.SIGN_UP}
					</Button>
				</nav>
			)}
		</header>
	);
};

export { Header };
