import { type SvgIconProperties } from "../types.js";

const SendIcon: React.FC<SvgIconProperties> = ({ size }: SvgIconProperties) => (
	<svg fill="none" height={size} viewBox="0 0 13.333 13.333" width={size}>
		<path d="M0 0l13.3 6.7L0 13.3l2.7-6.6z" fill="currentColor" />
	</svg>
);

export { SendIcon };
