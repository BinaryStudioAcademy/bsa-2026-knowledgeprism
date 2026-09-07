import { Header, RouterOutlet } from "~/components/components.js";

const AppLayout: React.FC = () => {
	return (
		<div className="flex min-h-screen flex-col bg-bg">
			<Header>Header</Header>

			<main className="flex-1">
				<RouterOutlet />
			</main>
		</div>
	);
};

export { AppLayout };
