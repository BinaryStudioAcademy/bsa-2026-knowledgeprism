import { RouterOutlet } from "~/components/components.js";

const SidebarLayout: React.FC = () => {
	return (
		<div className="flex min-h-full">
			<aside className="hidden w-[180px] shrink-0 border-r border-border bg-surface tablet:block desktop:w-[210px]">
				Sidebar
			</aside>

			<main className="min-w-0 flex-1">
				<RouterOutlet />
			</main>
		</div>
	);
};

export { SidebarLayout };
