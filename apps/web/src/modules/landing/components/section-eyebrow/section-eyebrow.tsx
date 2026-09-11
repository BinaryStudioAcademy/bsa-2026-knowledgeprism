type Properties = {
	children: string;
};

const SectionEyebrow: React.FC<Properties> = ({ children }: Properties) => (
	<span className="font-mono text-xs uppercase tracking-[0.08em] text-accent">
		{children}
	</span>
);

export { SectionEyebrow };
