import { Header, RouterOutlet } from "~/components/components.js";

const PublicLayout: React.FC = () => {
	return (
		<div className="flex min-h-screen flex-col bg-bg">
			<Header />

			<main className="flex-1">
				<RouterOutlet />
			</main>

			<footer className="shrink-0">Footer</footer>
		</div>
	);
};

export { PublicLayout };
