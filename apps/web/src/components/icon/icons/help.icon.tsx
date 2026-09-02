import { type SvgIconProperties } from "../types.js";

const HelpIcon: React.FC<SvgIconProperties> = ({ size }: SvgIconProperties) => (
	<svg fill="none" height={size} viewBox="0 0 20 20" width={size}>
		<circle cx="10" cy="10" r="7.5" stroke="currentColor" strokeWidth="1.4" />
		<path
			d="M7.8 8.2a2.2 2.2 0 1 1 3.4 1.8c-.7.5-1.2.9-1.2 1.8"
			stroke="currentColor"
			strokeLinecap="round"
			strokeWidth="1.4"
		/>
		<circle cx="10" cy="14.3" fill="currentColor" r="0.6" />
	</svg>
);

export { HelpIcon };
