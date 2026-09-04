import { Link as RouterLink, useNavigate } from "react-router-dom";

import { Button } from "~/components/button/button.js";
import { Logo } from "~/components/logo/logo.js";
import { useCallback, useEffect, useState } from "~/hooks/hooks.js";
import { AppRoute, Breakpoint } from "~/lib/enums/enums.js";
import { getValidClassNames } from "~/lib/helpers/helpers.js";
import {
	HEADER_LABEL,
	HEADER_MENU_ICON_HEIGHT,
	HEADER_MENU_ICON_STROKE_WIDTH,
	HEADER_MENU_ICON_WIDTH,
	HEADER_NAV_ID,
	HEADER_SECTION_LINKS,
	LANDING_HEADER_CLASS,
} from "./libs/constants.js";

const LandingHeader: React.FC = () => {
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
			`(min-width: ${String(Breakpoint.TABLET)}px)`,
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
				"sticky top-0 z-30",
				"border-b border-border bg-bg/92 backdrop-blur-[6px]",
			)}
		>
			<div className={LANDING_HEADER_CLASS.INNER}>
				<RouterLink
					className={getValidClassNames(
						"text-text no-underline",
						"hover:text-text hover:no-underline",
						LANDING_HEADER_CLASS.FOCUS_RING,
					)}
					to={AppRoute.ROOT}
				>
					<Logo />
				</RouterLink>

				<nav
					aria-label={HEADER_LABEL.PRIMARY_NAV}
					className={getValidClassNames(
						"hidden items-center gap-8",
						"tablet:flex",
					)}
				>
					{HEADER_SECTION_LINKS.map((item) => (
						<a
							className={getValidClassNames(
								"text-control text-text-muted no-underline",
								"hover:text-text hover:no-underline",
								LANDING_HEADER_CLASS.FOCUS_RING,
							)}
							href={item.href}
							key={item.href}
						>
							{item.label}
						</a>
					))}
					<div className={getValidClassNames("flex items-center gap-2.5")}>
						<Button
							className={getValidClassNames("px-3.5 py-[9px]")}
							onClick={handleSignIn}
							variant="ghost"
						>
							{HEADER_LABEL.SIGN_IN}
						</Button>
						<Button
							className={getValidClassNames("px-[18px] py-[9px]")}
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
					className={getValidClassNames(
						"cursor-pointer border-0 bg-transparent p-2 text-text",
						"tablet:hidden",
						LANDING_HEADER_CLASS.FOCUS_RING,
					)}
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
					aria-label={HEADER_LABEL.MOBILE_NAV}
					className={LANDING_HEADER_CLASS.MOBILE_NAV}
					id={HEADER_NAV_ID}
				>
					{HEADER_SECTION_LINKS.map((item) => (
						<a
							className={getValidClassNames(
								"text-body text-text no-underline",
								"hover:text-text hover:no-underline",
								LANDING_HEADER_CLASS.FOCUS_RING,
							)}
							href={item.href}
							key={item.href}
							onClick={handleCloseMenu}
						>
							{item.label}
						</a>
					))}
					<div className={getValidClassNames("mt-1.5 flex gap-2.5")}>
						<Button
							className={getValidClassNames(
								"flex-1",
								"border border-border",
								"py-2.5",
							)}
							onClick={handleSignIn}
							variant="ghost"
						>
							{HEADER_LABEL.SIGN_IN}
						</Button>
						<Button
							className={getValidClassNames("flex-1 py-2.5")}
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

export { LandingHeader };
