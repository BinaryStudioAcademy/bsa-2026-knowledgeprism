import { type SvgIconProperties } from "../types.js";

const UploadIcon: React.FC<SvgIconProperties> = ({
	size,
}: SvgIconProperties) => (
	<svg fill="none" height={size} viewBox="0 0 20 20" width={size}>
		<path
			d="M10 13V3M6 7l4-4 4 4"
			stroke="currentColor"
			strokeLinecap="round"
			strokeLinejoin="round"
			strokeWidth="1.5"
		/>
		<path
			d="M4 14v2a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2v-2"
			stroke="currentColor"
			strokeWidth="1.5"
		/>
	</svg>
);

export { UploadIcon };
