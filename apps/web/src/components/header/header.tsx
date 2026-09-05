import { Link as RouterLink, useNavigate } from "react-router-dom";

import { Button } from "~/components/button/button.js";
import { Logo } from "~/components/logo/logo.js";
import { useCallback, useEffect, useState } from "~/hooks/hooks.js";
import { AppRoute, Breakpoint } from "~/lib/enums/enums.js";
import { getValidClassNames } from "~/lib/helpers/helpers.js";

const HEADER_LABEL = {
	MENU: "Menu",
	SIGN_IN: "Sign in",
	SIGN_UP: "Sign up",
} as const;

const HEADER_MENU_ICON_HEIGHT = 12;
const HEADER_MENU_ICON_STROKE_WIDTH = 1.4;
const HEADER_MENU_ICON_WIDTH = 18;

const HEADER_NAV_ID = "header-nav";

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
		<header
			className={getValidClassNames(
				"sticky top-0 z-30 bg-surface",
				"border-b border-border",
			)}
		>
			<div
				className={getValidClassNames(
					"flex items-center justify-between",
					"px-5 py-3.5",
					"tablet-small:px-6 tablet-small:py-4",
					"tablet:px-8",
				)}
			>
				<RouterLink
					className={getValidClassNames(
						"text-text no-underline",
						"hover:text-text hover:no-underline",
					)}
					to={AppRoute.ROOT}
				>
					<Logo size="sm" />
				</RouterLink>

				<nav
					className={getValidClassNames(
						"hidden items-center gap-6",
						"tablet-small:flex",
					)}
				>
					<RouterLink
						className={getValidClassNames(
							"text-sm text-text-muted no-underline",
							"hover:text-text hover:no-underline",
						)}
						to={AppRoute.SIGN_IN}
					>
						{HEADER_LABEL.SIGN_IN}
					</RouterLink>
					<Button
						className={getValidClassNames("px-4 py-2")}
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
					className={getValidClassNames(
						"cursor-pointer border-0 bg-transparent p-0 text-text",
						"tablet-small:hidden",
					)}
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
				<nav
					className={getValidClassNames(
						"flex flex-col gap-3.5 bg-surface",
						"border-t border-border-subtle px-5 py-4",
						"tablet-small:hidden",
					)}
					id={HEADER_NAV_ID}
				>
					<Button
						className={getValidClassNames("w-full")}
						onClick={handleSignIn}
						variant="ghost"
					>
						{HEADER_LABEL.SIGN_IN}
					</Button>
					<Button
						className={getValidClassNames("w-full")}
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
