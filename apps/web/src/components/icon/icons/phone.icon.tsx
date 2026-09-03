import { type SvgIconProperties } from "../types.js";

const PhoneIcon: React.FC<SvgIconProperties> = ({
	size,
}: SvgIconProperties) => (
	<svg fill="none" height={size} viewBox="0 0 24 24" width={size}>
		<rect
			height="20"
			rx="2.5"
			stroke="currentColor"
			strokeWidth="1.4"
			width="12"
			x="6"
			y="2"
		/>
		<circle cx="12" cy="18" fill="currentColor" r="1" />
	</svg>
);

export { PhoneIcon };
