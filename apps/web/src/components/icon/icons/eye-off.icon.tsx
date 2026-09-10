import { type SvgIconProperties } from "../types.js";

const EyeOffIcon: React.FC<SvgIconProperties> = ({
	size,
}: SvgIconProperties) => (
	<svg fill="none" height={size} viewBox="0 0 20 20" width={size}>
		<path
			d="M8.75 4c.407-.16.837-.25 1.25-.25 3.333 0 6.667 2.083 8.333 6.25-.563 1.408-1.42 2.61-2.487 3.52"
			stroke="currentColor"
			strokeLinecap="round"
			strokeLinejoin="round"
			strokeWidth="1.5"
		/>
		<path
			d="M5.5 5.5C3.766 6.816 2.534 8.442 1.667 10c1.666 4.167 5 6.25 8.333 6.25 1.616 0 3.14-.492 4.417-1.333M2.5 2.5l15 15"
			stroke="currentColor"
			strokeLinecap="round"
			strokeLinejoin="round"
			strokeWidth="1.5"
		/>
		<path
			d="M8.232 8.232a2.5 2.5 0 0 0 3.536 3.536"
			stroke="currentColor"
			strokeLinecap="round"
			strokeLinejoin="round"
			strokeWidth="1.5"
		/>
	</svg>
);

export { EyeOffIcon };
