import { type SvgIconProperties } from "../types.js";

const FileRoundedIcon: React.FC<SvgIconProperties> = ({
	size,
}: SvgIconProperties) => (
	<svg fill="none" height={size} viewBox="0 0 20 20" width={size}>
		<path
			d="M5 2.5h7l3 3v11.5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V3.5a1 1 0 0 1 1-1z"
			stroke="currentColor"
			strokeLinejoin="round"
			strokeWidth="1.3"
		/>
	</svg>
);

export { FileRoundedIcon };
