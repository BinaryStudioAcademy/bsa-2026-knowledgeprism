import { type SvgIconProperties } from "../types.js";

const EyeIcon: React.FC<SvgIconProperties> = ({ size }: SvgIconProperties) => (
	<svg fill="none" height={size} viewBox="0 0 20 20" width={size}>
		<path
			d="M1.667 10C3.333 5.833 6.667 3.75 10 3.75s6.667 2.083 8.333 6.25c-1.666 4.167-5 6.25-8.333 6.25S3.333 14.167 1.667 10Z"
			stroke="currentColor"
			strokeLinecap="round"
			strokeLinejoin="round"
			strokeWidth="1.5"
		/>
		<circle
			cx="10"
			cy="10"
			r="2.5"
			stroke="currentColor"
			strokeLinecap="round"
			strokeLinejoin="round"
			strokeWidth="1.5"
		/>
	</svg>
);

export { EyeIcon };
