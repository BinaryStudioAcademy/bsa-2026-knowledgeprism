import { RouterOutlet } from "~/components/components.js";

const AuthLayout: React.FC = () => {
	return (
		<main className="min-h-screen bg-bg">
			<RouterOutlet />
		</main>
	);
};

export { AuthLayout };
