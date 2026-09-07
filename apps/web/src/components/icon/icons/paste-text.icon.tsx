import { type SvgIconProperties } from "../types.js";

const PasteTextIcon: React.FC<SvgIconProperties> = ({
	size,
}: SvgIconProperties) => (
	<svg fill="none" height={size} viewBox="0 0 20 20" width={size}>
		<path
			d="M3 4h14M3 9h14M3 14h9"
			stroke="currentColor"
			strokeLinecap="round"
			strokeWidth="1.5"
		/>
	</svg>
);

export { PasteTextIcon };
