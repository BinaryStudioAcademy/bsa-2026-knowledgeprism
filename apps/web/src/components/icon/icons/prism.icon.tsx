import { type SvgIconProperties } from "../types.js";

const PrismIcon: React.FC<SvgIconProperties> = ({
	size,
}: SvgIconProperties) => (
	<svg fill="none" height={size} viewBox="0 0 44 44" width={size}>
		<polygon fill="rgba(255,255,255,.6)" points="22,4 22,40 4,40" />
		<polygon fill="#fff" points="22,4 40,40 22,40" />
	</svg>
);

export { PrismIcon };
