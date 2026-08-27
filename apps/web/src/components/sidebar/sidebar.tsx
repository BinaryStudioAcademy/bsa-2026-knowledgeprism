import { Button } from "~/components/components.js";

const DEFAULT_ICON_SIZE = 14;

type IconProperties = {
	size?: number;
};

const KnowledgeTreeIcon: React.FC<IconProperties> = ({
	size = DEFAULT_ICON_SIZE,
}: IconProperties) => (
	<svg fill="none" height={size} viewBox="0 0 20 20" width={size}>
		<circle cx="10" cy="4.5" r="2" stroke="currentColor" strokeWidth="1.4" />
		<circle cx="4" cy="15.5" r="2" stroke="currentColor" strokeWidth="1.4" />
		<circle cx="16" cy="15.5" r="2" stroke="currentColor" strokeWidth="1.4" />
		<path
			d="M10 6.5V10M10 10L4 13.5M10 10l6 3.5"
			stroke="currentColor"
			strokeLinecap="round"
			strokeWidth="1.4"
		/>
	</svg>
);

const GlossaryIcon: React.FC<IconProperties> = ({
	size = DEFAULT_ICON_SIZE,
}: IconProperties) => (
	<svg fill="none" height={size} viewBox="0 0 20 20" width={size}>
		<path
			d="M10 6c-1.6-1.2-4-1.7-6.5-1.3v10c2.5-.4 4.9.1 6.5 1.3 1.6-1.2 4-1.7 6.5-1.3v-10C14 4.3 11.6 4.8 10 6z"
			stroke="currentColor"
			strokeLinejoin="round"
			strokeWidth="1.3"
		/>
		<path d="M10 6v10" stroke="currentColor" strokeWidth="1.3" />
	</svg>
);

const AskPrismIcon: React.FC<IconProperties> = ({
	size = DEFAULT_ICON_SIZE,
}: IconProperties) => (
	<svg fill="none" height={size} viewBox="0 0 20 20" width={size}>
		<path
			d="M3.5 5.5a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2H9.5l-3.5 2.8V13.5h-.5a2 2 0 0 1-2-2z"
			stroke="currentColor"
			strokeLinejoin="round"
			strokeWidth="1.3"
		/>
	</svg>
);

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
	{
		icon: (
			<svg fill="none" height="14" viewBox="0 0 20 20" width="14">
				<circle
					cx="10"
					cy="10"
					r="7.5"
					stroke="rgb(135,130,122)"
					strokeWidth="1.4"
				/>
				<path
					d="M7.8 8.2a2.2 2.2 0 1 1 3.4 1.8c-.7.5-1.2.9-1.2 1.8"
					stroke="rgb(135,130,122)"
					strokeLinecap="round"
					strokeWidth="1.4"
				/>
				<circle cx="10" cy="14.3" fill="rgb(135,130,122)" r="0.6" />
			</svg>
		),
		label: "Help",
	},
	{
		icon: (
			<svg fill="none" height="14" viewBox="0 0 20 20" width="14">
				<path
					d="M10 3.3l1.1 1.6 1.9-.5.7 1.9 1.9.7-.5 1.9 1.6 1.1-1.6 1.1.5 1.9-1.9.7-.7 1.9-1.9-.5L10 16.7l-1.1-1.6-1.9.5-.7-1.9-1.9-.7.5-1.9L3.3 10l1.6-1.1-.5-1.9 1.9-.7.7-1.9 1.9.5z"
					stroke="rgb(135,130,122)"
					strokeLinejoin="round"
					strokeWidth="1.1"
				/>
				<circle
					cx="10"
					cy="10"
					r="2.3"
					stroke="rgb(135,130,122)"
					strokeWidth="1.2"
				/>
			</svg>
		),
		label: "Settings",
	},
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
		<div className="hidden desktop:flex items-center gap-[10px] p-2">
			<svg fill="none" height="18" viewBox="0 0 20 20" width="18">
				<path
					d="M10 2l6 3.5v9L10 18l-6-3.5v-9z"
					stroke="rgb(42,107,90)"
					strokeWidth="1.4"
				/>
			</svg>
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
