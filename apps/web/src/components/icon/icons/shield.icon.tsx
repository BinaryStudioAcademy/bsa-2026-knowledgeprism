import { type SvgIconProperties } from "../types.js";

const ShieldIcon: React.FC<SvgIconProperties> = ({
	size,
}: SvgIconProperties) => (
	<svg fill="none" height={size} viewBox="0 0 20 20" width={size}>
		<path
			d="M10 2l7 4v5c0 4-3 6.5-7 7.5-4-1-7-3.5-7-7.5V6z"
			stroke="currentColor"
			strokeWidth="1.4"
		/>
	</svg>
);

export { ShieldIcon };
