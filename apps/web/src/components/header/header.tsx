import { useNavigate } from "react-router-dom";
import { tv } from "tailwind-variants";

import { Button } from "~/components/button/button.js";
import { Icon } from "~/components/icon/icon.js";
import { Link } from "~/components/link/link.js";
import { Logo } from "~/components/logo/logo.js";
import { useCallback, useState } from "~/hooks/hooks.js";
import { AppRoute } from "~/lib/enums/enums.js";

const getHeaderClassName = tv({
	slots: {
		bar: "mx-auto flex min-h-[72px] w-full max-w-[1240px] items-center justify-between px-5 tablet-small:px-6 tablet:px-10",
		brand: "text-text no-underline hover:text-text hover:no-underline",
		desktopNav: [
			"hidden items-center gap-8 tablet-small:flex",
			"[&>a]:rounded-md [&>a]:px-3.5 [&>a]:py-2 [&>a]:text-control [&>a]:font-medium",
			"[&>a]:text-text [&>a]:no-underline [&>a]:hover:bg-secondary [&>a]:hover:text-text [&>a]:hover:no-underline",
		],
		mobileNav:
			"flex flex-col gap-3.5 border-t border-border bg-bg px-5 py-4 tablet-small:hidden",
		root: "sticky top-0 z-30 shrink-0 border-b border-border bg-bg/92 backdrop-blur-[6px]",
		toggle:
			"cursor-pointer border-0 bg-transparent p-2 text-text tablet-small:hidden focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-accent/35",
	},
});

const Header: React.FC = () => {
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

	return (
		<header className={root()}>
			<div className={bar()}>
				<Logo className={brand()} size="sm" to={AppRoute.ROOT} />

				<nav className={desktopNav()}>
					<Link to={AppRoute.SIGN_IN} variant="muted">
						Sign in
					</Link>
					<Button
						className="px-4 py-2"
						onClick={handleSignUp}
						variant="primary"
					>
						Sign up
					</Button>
				</nav>

				<button
					aria-controls="header-nav"
					aria-expanded={isMenuOpen}
					aria-label="Menu"
					className={toggle()}
					onClick={handleToggleMenu}
					type="button"
				>
					<Icon name="hamburger" size={18} />
				</button>
			</div>

			{isMenuOpen && (
				<nav className={mobileNav()} id="header-nav">
					<Button className="w-full" onClick={handleSignIn} variant="ghost">
						Sign in
					</Button>
					<Button className="w-full" onClick={handleSignUp} variant="primary">
						Sign up
					</Button>
				</nav>
			)}
		</header>
	);
};

export { Header };
