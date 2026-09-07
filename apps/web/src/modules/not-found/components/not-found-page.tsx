import { Link } from "~/components/components.js";
import { AppRoute } from "~/lib/enums/enums.js";

const NotFoundPage: React.FC = () => {
	return (
		<main className="flex min-h-screen flex-col justify-center p-6">
			<div className="mx-auto flex w-full max-w-lg flex-col items-center gap-3 rounded-lg border border-error/25 bg-error-bg px-8 py-10 text-center tablet:max-w-2xl tablet:gap-5 tablet:px-16 tablet:py-20">
				<h1 className="font-serif text-display text-error">404</h1>
				<p className="text-text">This page doesn&apos;t exist.</p>
				<p className="text-sm text-text-muted">
					The link might be broken, or the page may have moved.
				</p>
				<Link to={AppRoute.ROOT}>Back to home</Link>
			</div>
		</main>
	);
};

export { NotFoundPage };
