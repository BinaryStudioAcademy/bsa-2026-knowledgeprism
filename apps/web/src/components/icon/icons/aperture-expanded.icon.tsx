import { type SvgIconProperties } from "../types.js";

const ApertureExpandedIcon: React.FC<SvgIconProperties> = ({
	size,
}: SvgIconProperties) => (
	<svg fill="none" height={size} viewBox="0 0 20 20" width={size}>
		<circle cx="10" cy="10" r="2.6" stroke="currentColor" strokeWidth="1.4" />
		<path
			d="M10 3v2.2M10 14.8V17M3 10h2.2M14.8 10H17M5.3 5.3l1.5 1.5M13.2 13.2l1.5 1.5M5.3 14.7l1.5-1.5M13.2 6.8l1.5-1.5"
			stroke="currentColor"
			strokeWidth="1.4"
		/>
	</svg>
);

export { ApertureExpandedIcon };
