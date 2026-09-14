import { type SvgIconProperties } from "../types.js";

const EyeIcon: React.FC<SvgIconProperties> = ({ size }: SvgIconProperties) => (
	<svg fill="none" height={size} viewBox="0 0 24 24" width={size}>
		<path
			d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"
			stroke="currentColor"
			strokeLinecap="round"
			strokeLinejoin="round"
			strokeWidth="1.5"
		/>
		<circle
			cx="12"
			cy="12"
			r="3"
			stroke="currentColor"
			strokeLinecap="round"
			strokeLinejoin="round"
			strokeWidth="1.5"
		/>
	</svg>
);

export { EyeIcon };
