import { type SvgIconProperties } from "../types.js";

const TabletIcon: React.FC<SvgIconProperties> = ({
	size,
}: SvgIconProperties) => (
	<svg fill="none" height={size} viewBox="0 0 24 24" width={size}>
		<rect
			height="18"
			rx="3"
			stroke="currentColor"
			strokeWidth="1.4"
			width="16"
			x="4"
			y="3"
		/>
		<circle cx="12" cy="18" fill="currentColor" r="1" />
	</svg>
);

export { TabletIcon };
