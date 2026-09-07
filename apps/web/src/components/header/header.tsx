type Properties = {
	children: React.ReactNode;
};

const Header: React.FC<Properties> = ({ children }: Properties) => (
	<header className="h-[57px] shrink-0 border-b border-border bg-surface px-[18px] tablet:h-[65px] tablet:px-[28px]">
		{children}
	</header>
);

export { Header };
