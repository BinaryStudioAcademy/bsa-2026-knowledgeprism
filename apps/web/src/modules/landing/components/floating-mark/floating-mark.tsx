type Properties = {
	className: string;
};

const FloatingMark: React.FC<Properties> = ({ className }: Properties) => (
	<svg aria-hidden="true" className={className} viewBox="0 0 44 44">
		<polygon fill="currentColor" points="22,4 22,40 4,40" />
		<polygon fill="currentColor" points="22,4 40,40 22,40" />
	</svg>
);

export { FloatingMark };
