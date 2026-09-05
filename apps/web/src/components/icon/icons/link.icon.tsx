import { type SvgIconProperties } from "../types.js";

const LinkIcon: React.FC<SvgIconProperties> = ({ size }: SvgIconProperties) => (
	<svg fill="none" height={size} viewBox="0 0 20 20" width={size}>
		<path
			d="M8.5 11.5a3 3 0 0 0 4 .3l2-2a3 3 0 0 0-4.2-4.2l-1 1M11.5 8.5a3 3 0 0 0-4-.3l-2 2a3 3 0 0 0 4.2 4.2l1-1"
			stroke="currentColor"
			strokeLinecap="round"
			strokeWidth="1.4"
		/>
	</svg>
);

export { LinkIcon };
