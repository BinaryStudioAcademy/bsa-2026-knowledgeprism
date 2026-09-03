import { type SvgIconProperties } from "../types.js";

const BellIcon: React.FC<SvgIconProperties> = ({ size }: SvgIconProperties) => (
	<svg fill="none" height={size} viewBox="0 0 20 20" width={size}>
		<path
			d="M10 2a5 5 0 0 0-5 5v3.5l-1.5 3h13L15 10.5V7a5 5 0 0 0-5-5z"
			stroke="currentColor"
			strokeWidth="1.4"
		/>
		<path d="M8 16a2 2 0 0 0 4 0" stroke="currentColor" strokeWidth="1.4" />
	</svg>
);

export { BellIcon };
