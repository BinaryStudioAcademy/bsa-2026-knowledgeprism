import { Header, Logo, RouterOutlet } from "~/components/components.js";
import { AppRoute } from "~/lib/enums/enums.js";

const PublicLayout: React.FC = () => {
	return (
		<div className="flex min-h-screen flex-col bg-bg">
			<Header>
				<Logo to={AppRoute.ROOT} />
			</Header>

			<main className="flex-1">
				<RouterOutlet />
			</main>

			<footer className="shrink-0">Footer</footer>
		</div>
	);
};

export { PublicLayout };
