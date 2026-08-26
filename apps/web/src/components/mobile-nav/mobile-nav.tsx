import {
	AskPrismIcon,
	GlossaryIcon,
	KnowledgeTreeIcon,
} from "~/components/icons/icons.js";

type MobileNavItem = {
	icon: React.ReactNode;
	isActive?: boolean;
	label: string;
};

const mobileNavItems: MobileNavItem[] = [
	{ icon: <KnowledgeTreeIcon size={16} />, label: "Tree" },
	{ icon: <GlossaryIcon size={16} />, isActive: true, label: "Glossary" },
	{ icon: <AskPrismIcon size={16} />, label: "Ask" },
];

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

export { MobileNav };
