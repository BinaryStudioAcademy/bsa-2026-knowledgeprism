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

export { DesktopIcon, PhoneIcon, TabletIcon };
