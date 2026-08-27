import { Button } from "~/components/components.js";
import {
	AskPrismIcon,
	GlossaryIcon,
	HelpIcon,
	KnowledgeTreeIcon,
	ProjectIcon,
	SettingsIcon,
} from "~/components/icon/icon.js";

type NavItem = {
	icon: React.ReactNode;
	isActive?: boolean;
	label: string;
};

const primaryNavItems: NavItem[] = [
	{ icon: <KnowledgeTreeIcon />, label: "Knowledge Tree" },
	{ icon: <GlossaryIcon />, isActive: true, label: "Glossary" },
	{ icon: <AskPrismIcon />, label: "Ask Prism" },
];

const utilityNavItems: NavItem[] = [
	{ icon: <HelpIcon />, label: "Help" },
	{ icon: <SettingsIcon />, label: "Settings" },
];

const mobileNavItems: NavItem[] = [
	{ icon: <KnowledgeTreeIcon size={16} />, label: "Tree" },
	{ icon: <GlossaryIcon size={16} />, isActive: true, label: "Glossary" },
	{ icon: <AskPrismIcon size={16} />, label: "Ask" },
];

const NavRow = ({ icon, isActive, label }: NavItem) => (
	<div
		className={`nav-item tablet:h-[34px] tablet:w-[34px] tablet:justify-center tablet:p-0 desktop:h-auto desktop:w-auto desktop:justify-start desktop:px-[12px] desktop:py-[10px] ${isActive ? "is-active" : ""}`}
	>
		{icon}
		<span className="hidden desktop:inline">{label}</span>
	</div>
);

const Sidebar: React.FC = () => (
	<aside className="hidden tablet:flex tablet:w-14 desktop:w-[232px] flex-shrink-0 flex-col gap-5 border-r border-[var(--color-border)] bg-[var(--color-surface)] p-[20px_14px]">
		<div className="hidden desktop:flex items-center gap-[10px] p-2 text-accent">
			<ProjectIcon size={18} />
			<div>
				<div className="text-[13px] font-medium">Project Alpha</div>
				<div className="font-mono text-[10px] text-[var(--color-text-faint)]">
					EDITOR ROLE
				</div>
			</div>
		</div>

		<nav className="flex flex-col gap-0.5">
			{primaryNavItems.map((item) => (
				<NavRow key={item.label} {...item} />
			))}
		</nav>

		<div className="hidden desktop:flex mt-auto flex-col gap-[10px] border-t border-[var(--color-border-subtle)] pt-[14px]">
			<Button label="Add Knowledge" />
			<div className="flex flex-col gap-0.5">
				{utilityNavItems.map((item) => (
					<NavRow key={item.label} {...item} />
				))}
			</div>
		</div>
	</aside>
);

const MobileNav: React.FC = () => (
	<nav className="flex flex-shrink-0 tablet:hidden border-t border-[var(--color-border)] bg-[var(--color-surface)]">
		{mobileNavItems.map(({ icon, isActive, label }) => (
			<div
				className={`flex flex-1 flex-col items-center gap-[3px] py-[9px] text-[10px] ${
					isActive ? "text-accent" : "text-text-muted"
				}`}
				key={label}
			>
				{icon}
				{label}
			</div>
		))}
	</nav>
);

export { MobileNav, Sidebar };
