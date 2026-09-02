import { type SvgIconProperties } from "../types.js";

const CheckboxTickIcon: React.FC<SvgIconProperties> = ({
	size,
}: SvgIconProperties) => (
	<svg fill="none" height={size} viewBox="0 0 10.867 8.017" width={size}>
		<path
			d="M1 4l3 3 5.5-6.5"
			stroke="currentColor"
			strokeLinecap="round"
			strokeLinejoin="round"
			strokeWidth="1.8"
		/>
	</svg>
);

export { CheckboxTickIcon };
