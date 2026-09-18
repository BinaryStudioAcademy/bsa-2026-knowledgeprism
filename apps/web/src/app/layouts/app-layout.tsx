import { Header, RouterOutlet } from "~/components/components.js";

const AppLayout: React.FC = () => {
	return (
		<div className="flex min-h-screen flex-col bg-bg">
			<Header>Header</Header>

			<div className="min-h-0 flex-1">
				<RouterOutlet />
			</div>
		</div>
	);
};

export { AppLayout };
