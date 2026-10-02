import { type SvgIconProperties } from "../types.js";

const WarningIcon: React.FC<SvgIconProperties> = ({
	size,
}: SvgIconProperties) => (
	<svg fill="none" height={size} viewBox="0 0 16 16" width={size}>
		<path
			d="M8 2l6.5 11.5h-13L8 2zM8 6.5v3M8 11.6v.1"
			stroke="currentColor"
			strokeLinecap="round"
			strokeLinejoin="round"
			strokeWidth="1.6"
		/>
	</svg>
);

export { WarningIcon };
