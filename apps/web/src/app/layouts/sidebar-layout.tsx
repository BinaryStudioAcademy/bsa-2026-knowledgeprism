import { MobileNav, RouterOutlet, Sidebar } from "~/components/components.js";

// TODO: replace with the real project name/role once the projects API lands
const PROJECT_NAME = "Project Alpha";
const PROJECT_ROLE = "EDITOR";

const SidebarLayout: React.FC = () => {
	return (
		<div className="flex h-screen flex-col tablet:flex-row">
			<Sidebar projectName={PROJECT_NAME} role={PROJECT_ROLE} />

			<main className="min-w-0 flex-1 overflow-auto">
				<RouterOutlet />
			</main>

			<MobileNav />
		</div>
	);
};

export { SidebarLayout };
