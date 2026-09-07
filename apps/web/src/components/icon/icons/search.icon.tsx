import { type SvgIconProperties } from "../types.js";

const SearchIcon: React.FC<SvgIconProperties> = ({
	size,
}: SvgIconProperties) => (
	<svg fill="none" height={size} viewBox="0 0 20 20" width={size}>
		<circle cx="9" cy="9" r="6.5" stroke="currentColor" strokeWidth="1.6" />
		<path
			d="M18 18l-4-4"
			stroke="currentColor"
			strokeLinecap="round"
			strokeWidth="1.6"
		/>
	</svg>
);

export { SearchIcon };
