import { type SvgIconProperties } from "../types.js";

const SquarePlaceholderIcon: React.FC<SvgIconProperties> = ({
	size,
}: SvgIconProperties) => (
	<svg fill="none" height={size} viewBox="0 0 20 20" width={size}>
		<path d="M4 4h12v12H4z" stroke="currentColor" strokeWidth="1.4" />
	</svg>
);

export { SquarePlaceholderIcon };
