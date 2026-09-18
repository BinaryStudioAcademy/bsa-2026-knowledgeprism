import { type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { tv } from "tailwind-variants";

import { Button } from "~/components/button/button.js";
import { Icon } from "~/components/icon/icon.js";
import { Logo } from "~/components/logo/logo.js";
import { useCallback, useEffect, useState } from "~/hooks/hooks.js";
import { AppRoute } from "~/lib/enums/enums.js";

const HEADER_BREAKPOINT_VARIABLE = "--breakpoint-tablet";

const CUSTOM_HEADER_CLASS_NAME =
	"h-[57px] shrink-0 border-b border-border bg-surface px-[18px] tablet:h-[65px] tablet:px-[28px]";

type CustomHeaderProperties = {
	children: ReactNode;
};

type Properties = {
	children?: ReactNode;
};

const getHeaderClassName = tv({
	slots: {
		bar: "mx-auto flex h-[72px] w-full max-w-[1240px] items-center justify-between px-[clamp(20px,5vw,40px)]",
		brand: "text-text no-underline hover:text-text hover:no-underline",
		desktopNav: "hidden items-center gap-2.5 tablet:flex",
		mobileNav:
			"mx-auto flex w-full max-w-[1240px] gap-2.5 border-t border-border bg-bg px-[clamp(20px,5vw,40px)] py-4 tablet:hidden",
		root: "sticky top-0 z-30 shrink-0 border-b border-border bg-bg/92 backdrop-blur-[6px]",
		toggle:
			"cursor-pointer border-0 bg-transparent p-2 text-text tablet:hidden focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-accent/35",
	},
});

const CustomHeader: React.FC<CustomHeaderProperties> = ({
	children,
}: CustomHeaderProperties) => {
	return <header className={CUSTOM_HEADER_CLASS_NAME}>{children}</header>;
};

const DefaultHeader: React.FC = () => {
	const navigate = useNavigate();
	const [isMenuOpen, setIsMenuOpen] = useState(false);
	const { bar, brand, desktopNav, mobileNav, root, toggle } =
		getHeaderClassName();

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
		if (typeof matchMedia !== "function") {
			return;
		}

		const breakpoint = getComputedStyle(document.documentElement)
			.getPropertyValue(HEADER_BREAKPOINT_VARIABLE)
			.trim();

		if (!breakpoint) {
			return;
		}

		const mediaQuery = matchMedia(`(min-width: ${breakpoint})`);

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
				<Logo className={brand()} to={AppRoute.ROOT} />

				<nav className={desktopNav()}>
					<Button
						className="px-3.5 py-[9px]"
						onClick={handleSignIn}
						variant="ghost"
					>
						Sign in
					</Button>

					<Button
						className="px-[18px] py-[9px]"
						onClick={handleSignUp}
						variant="primary"
					>
						Sign up
					</Button>
				</nav>

				<button
					aria-controls="header-nav"
					aria-expanded={isMenuOpen}
					aria-label={isMenuOpen ? "Close menu" : "Open menu"}
					className={toggle()}
					onClick={handleToggleMenu}
					type="button"
				>
					<Icon name="hamburger" size={20} />
				</button>
			</div>

			{isMenuOpen && (
				<nav className={mobileNav()} id="header-nav">
					<Button
						className="flex-1 border border-border py-2.5"
						onClick={handleSignIn}
						variant="ghost"
					>
						Sign in
					</Button>

					<Button
						className="flex-1 py-2.5"
						onClick={handleSignUp}
						variant="primary"
					>
						Sign up
					</Button>
				</nav>
			)}
		</header>
	);
};

const Header: React.FC<Properties> = ({ children }: Properties) => {
	if (Boolean(children)) {
		return <CustomHeader>{children}</CustomHeader>;
	}

	return <DefaultHeader />;
};

export { Header };
