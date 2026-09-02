import { type SvgIconProperties } from "../types.js";

const ChevronDownIcon: React.FC<SvgIconProperties> = ({
	size,
}: SvgIconProperties) => (
	<svg fill="none" height={size} viewBox="0 0 20 20" width={size}>
		<path
			d="M5 7.5l5 5 5-5"
			stroke="currentColor"
			strokeLinecap="round"
			strokeWidth="1.6"
		/>
	</svg>
);

export { ChevronDownIcon };
