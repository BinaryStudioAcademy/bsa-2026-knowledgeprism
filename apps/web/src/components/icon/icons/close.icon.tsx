import { type SvgIconProperties } from "../types.js";

const CloseIcon: React.FC<SvgIconProperties> = ({
	size,
}: SvgIconProperties) => (
	<svg fill="none" height={size} viewBox="0 0 14 14" width={size}>
		<path
			d="M1 1l12 12M13 1L1 13"
			stroke="currentColor"
			strokeLinecap="round"
			strokeWidth="1.5"
		/>
	</svg>
);

export { CloseIcon };
