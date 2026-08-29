import { Button } from "~/components/components.js";
import { Icon } from "~/components/icon/icon.js";
import { getValidClassNames } from "~/lib/helpers/helpers.js";

type NavItem = {
	icon: React.ReactNode;
	isActive?: boolean;
	label: string;
};

const primaryNavItems: NavItem[] = [
	{ icon: <Icon name="knowledge-tree" />, label: "Knowledge Tree" },
	{ icon: <Icon name="glossary" />, isActive: true, label: "Glossary" },
	{ icon: <Icon name="ask-prism" />, label: "Ask Prism" },
];

const utilityNavItems: NavItem[] = [
	{ icon: <Icon name="help" />, label: "Help" },
	{ icon: <Icon name="settings" />, label: "Settings" },
];

const mobileNavItems: NavItem[] = [
	{ icon: <Icon name="knowledge-tree" size={16} />, label: "Tree" },
	{
		icon: <Icon name="glossary" size={16} />,
		isActive: true,
		label: "Glossary",
	},
	{ icon: <Icon name="ask-prism" size={16} />, label: "Ask" },
];

const NavRow = ({ icon, isActive, label }: NavItem) => (
	<button
		aria-current={isActive ? "page" : undefined}
		className={getValidClassNames(
			"nav-item tablet:h-[34px] tablet:w-[34px] tablet:justify-center tablet:p-0 desktop:h-auto desktop:w-auto desktop:justify-start desktop:px-[12px] desktop:py-[10px]",
			{ "is-active": isActive },
		)}
		type="button"
	>
		{icon}
		<span className="hidden desktop:inline">{label}</span>
	</button>
);

const Sidebar: React.FC = () => (
	<aside className="hidden tablet:flex tablet:w-14 desktop:w-[232px] flex-shrink-0 flex-col gap-5 border-r border-border bg-surface p-[20px_14px]">
		<div className="hidden desktop:flex items-center gap-[10px] p-2 text-accent">
			<Icon name="project" size={18} />
			<div>
				<div className="text-[13px] font-medium">Project Alpha</div>
				<div className="font-mono text-[10px] text-text-faint">EDITOR ROLE</div>
			</div>
		</div>

		<nav className="flex flex-col gap-0.5">
			{primaryNavItems.map((item) => (
				<NavRow key={item.label} {...item} />
			))}
		</nav>

		<div className="hidden desktop:flex mt-auto flex-col gap-[10px] border-t border-border-subtle pt-[14px]">
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
	<nav className="flex flex-shrink-0 tablet:hidden border-t border-border bg-surface">
		{mobileNavItems.map(({ icon, isActive, label }) => (
			<button
				aria-current={isActive ? "page" : undefined}
				className={getValidClassNames(
					"flex flex-1 flex-col items-center gap-[3px] py-[9px] text-[10px] border-none bg-transparent cursor-pointer font-sans",
					{ "text-accent": isActive, "text-text-muted": !isActive },
				)}
				key={label}
				type="button"
			>
				{icon}
				{label}
			</button>
		))}
	</nav>
);
export { MobileNav, Sidebar };
