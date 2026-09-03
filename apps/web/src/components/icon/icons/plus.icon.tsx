import { type SvgIconProperties } from "../types.js";

const PlusIcon: React.FC<SvgIconProperties> = ({ size }: SvgIconProperties) => (
	<svg fill="none" height={size} viewBox="0 0 20 20" width={size}>
		<path
			d="M10 3v14M3 10h14"
			stroke="currentColor"
			strokeLinecap="round"
			strokeWidth="1.6"
		/>
	</svg>
);

export { PlusIcon };
