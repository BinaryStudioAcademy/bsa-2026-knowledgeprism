import { type SvgIconProperties } from "../types.js";

const FileIcon: React.FC<SvgIconProperties> = ({ size }: SvgIconProperties) => (
	<svg fill="none" height={size} viewBox="0 0 20 20" width={size}>
		<rect
			height="16"
			rx="1.5"
			stroke="currentColor"
			strokeWidth="1.3"
			width="12"
			x="4"
			y="2"
		/>
	</svg>
);

export { FileIcon };
