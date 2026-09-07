import { type SvgIconProperties } from "../types.js";

const SettingsIcon: React.FC<SvgIconProperties> = ({
	size,
}: SvgIconProperties) => (
	<svg fill="none" height={size} viewBox="0 0 20 20" width={size}>
		<path
			d="M10 3.3l1.1 1.6 1.9-.5.7 1.9 1.9.7-.5 1.9 1.6 1.1-1.6 1.1.5 1.9-1.9.7-.7 1.9-1.9-.5L10 16.7l-1.1-1.6-1.9.5-.7-1.9-1.9-.7.5-1.9L3.3 10l1.6-1.1-.5-1.9 1.9-.7.7-1.9 1.9.5z"
			stroke="currentColor"
			strokeLinejoin="round"
			strokeWidth="1.1"
		/>
		<circle cx="10" cy="10" r="2.3" stroke="currentColor" strokeWidth="1.2" />
	</svg>
);

export { SettingsIcon };
