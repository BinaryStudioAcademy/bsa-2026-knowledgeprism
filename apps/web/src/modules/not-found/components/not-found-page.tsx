import { Link } from "~/components/components.js";
import { AppRoute } from "~/lib/enums/enums.js";

const NotFoundPage: React.FC = () => {
	return (
		<main>
			<h1>404</h1>
			<p>This page doesn't exist.</p>
			<Link to={AppRoute.ROOT}>Back to home</Link>
		</main>
	);
};

export { NotFoundPage };
