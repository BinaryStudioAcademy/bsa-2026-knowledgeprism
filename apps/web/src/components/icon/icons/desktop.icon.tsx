import { type SvgIconProperties } from "../types.js";

const DesktopIcon: React.FC<SvgIconProperties> = ({
	size,
}: SvgIconProperties) => (
	<svg fill="none" height={size} viewBox="0 0 24 24" width={size}>
		<rect
			height="13"
			rx="1.5"
			stroke="currentColor"
			strokeWidth="1.4"
			width="18"
			x="3"
			y="4"
		/>
		<path d="M8 20h8" stroke="currentColor" strokeWidth="1.4" />
	</svg>
);

export { DesktopIcon };
