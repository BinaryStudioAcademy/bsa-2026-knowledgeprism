import { Header, RouterOutlet } from "~/components/components.js";

const AppLayout: React.FC = () => {
	return (
		<div className="flex h-dvh flex-col bg-bg">
			<Header>Header</Header>

			<div className="flex min-h-0 flex-1 flex-col">
				<RouterOutlet />
			</div>
		</div>
	);
};

export { AppLayout };
