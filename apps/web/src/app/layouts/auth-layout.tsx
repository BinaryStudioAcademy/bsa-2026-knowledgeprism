import { RouterOutlet } from "~/components/components.js";

const AuthLayout: React.FC = () => {
	return (
		<div className="min-h-screen bg-bg">
			<RouterOutlet />
		</div>
	);
};

export { AuthLayout };
