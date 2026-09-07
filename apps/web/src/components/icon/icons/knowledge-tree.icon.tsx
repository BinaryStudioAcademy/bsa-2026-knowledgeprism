import { type SvgIconProperties } from "../types.js";

const KnowledgeTreeIcon: React.FC<SvgIconProperties> = ({
	size,
}: SvgIconProperties) => (
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

export { KnowledgeTreeIcon };
