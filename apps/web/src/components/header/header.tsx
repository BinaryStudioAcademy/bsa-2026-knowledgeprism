import { Link } from "~/components/link/link.js";
import { useCallback, useEffect, useState } from "~/hooks/hooks.js";
import { AppRoute, Breakpoint } from "~/lib/enums/enums.js";
import { getValidClassNames } from "~/lib/helpers/helpers.js";

import {
	HEADER_BRAND_NAME,
	HEADER_LABEL,
	HEADER_LOGO_FILL,
	HEADER_LOGO_SIZE,
	HEADER_MENU_ICON_HEIGHT,
	HEADER_MENU_ICON_STROKE_WIDTH,
	HEADER_MENU_ICON_WIDTH,
	HEADER_NAV_ID,
	HEADER_SECTION_LINKS,
	HeaderClass,
} from "./libs/constants.js";

const Header: React.FC = () => {
	const [isMenuOpen, setIsMenuOpen] = useState(false);

	const handleToggleMenu = useCallback((): void => {
		setIsMenuOpen((isOpen) => !isOpen);
	}, []);

	const handleCloseMenu = useCallback((): void => {
		setIsMenuOpen(false);
	}, []);

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

	const navClassName = getValidClassNames(HeaderClass.NAV, {
		[HeaderClass.NAV_CLOSED]: !isMenuOpen,
		[HeaderClass.NAV_OPEN]: isMenuOpen,
	});

	return (
		<header className={HeaderClass.ROOT}>
			<div className={HeaderClass.BAR}>
				<Link className={HeaderClass.BRAND} to={AppRoute.ROOT}>
					<svg
						aria-hidden="true"
						height={HEADER_LOGO_SIZE}
						viewBox="0 0 44 44"
						width={HEADER_LOGO_SIZE}
					>
						<polygon fill={HEADER_LOGO_FILL.DARK} points="22,4 22,40 4,40" />
						<polygon fill={HEADER_LOGO_FILL.MEDIUM} points="22,4 40,40 22,40" />
						<polygon fill={HEADER_LOGO_FILL.LIGHT} points="22,4 22,22 4,40" />
					</svg>
					<span>
						{HEADER_BRAND_NAME.LEAD}
						<span className={HeaderClass.BRAND_ACCENT}>
							{HEADER_BRAND_NAME.ACCENT}
						</span>
					</span>
				</Link>

				<button
					aria-controls={HEADER_NAV_ID}
					aria-expanded={isMenuOpen}
					aria-label={HEADER_LABEL.MENU}
					className={HeaderClass.TOGGLE}
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

				<nav className={navClassName} id={HEADER_NAV_ID}>
					{HEADER_SECTION_LINKS.map((item) => (
						<a
							className={HeaderClass.LINK}
							href={item.href}
							key={item.href}
							onClick={handleCloseMenu}
						>
							{item.label}
						</a>
					))}
					<Link className={HeaderClass.SIGN_IN} to={AppRoute.SIGN_IN}>
						{HEADER_LABEL.SIGN_IN}
					</Link>
					<Link className={HeaderClass.SIGN_UP} to={AppRoute.SIGN_UP}>
						{HEADER_LABEL.SIGN_UP}
					</Link>
				</nav>
			</div>
		</header>
	);
};

export { Header };
