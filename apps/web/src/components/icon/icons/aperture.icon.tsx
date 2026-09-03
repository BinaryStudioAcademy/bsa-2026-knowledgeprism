import { type SvgIconProperties } from "../types.js";

const ApertureIcon: React.FC<SvgIconProperties> = ({
	size,
}: SvgIconProperties) => (
	<svg fill="none" height={size} viewBox="0 0 20 20" width={size}>
		<circle cx="10" cy="10" r="2.6" stroke="currentColor" strokeWidth="1.4" />
		<path
			d="M10 3v2.2M10 14.8V17M3 10h2.2M14.8 10H17"
			stroke="currentColor"
			strokeWidth="1.4"
		/>
	</svg>
);

export { ApertureIcon };
