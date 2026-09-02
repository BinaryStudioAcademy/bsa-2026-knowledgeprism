import { type SvgIconProperties } from "../types.js";

const ParagraphIcon: React.FC<SvgIconProperties> = ({
	size,
}: SvgIconProperties) => (
	<svg fill="none" height={size} viewBox="0 0 20 20" width={size}>
		<path
			d="M3 3h14M3 8h14M3 13h10M3 18h10"
			stroke="currentColor"
			strokeWidth="1.4"
		/>
	</svg>
);

export { ParagraphIcon };
